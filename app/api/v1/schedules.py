from datetime import date, timedelta
from types import SimpleNamespace
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db
from app.models.employee import Availability, Employee
from app.models.schedule import Schedule, ShiftAssignment
from app.models.shift import ShiftConfig
from app.services.sa_optimizer import SimulatedAnnealingScheduler
from app.services.schedule_service import ScheduleService

router = APIRouter()


@router.post("/seed")
async def seed_dummy_data(db: AsyncSession = Depends(get_db)):
    """Isi database dengan data dummy untuk testing."""
    base_date = date.today()

    # Reset data lama agar endpoint seed bisa dijalankan berulang kali
    await db.execute(delete(ShiftAssignment))
    await db.execute(delete(Schedule))
    await db.execute(delete(Availability))
    await db.execute(delete(ShiftConfig))
    await db.execute(delete(Employee))
    await db.commit()

    for i in range(1, 6):
        db.add(Employee(name=f"Pegawai {i}", max_shifts_per_week=5))
    await db.commit()

    result = await db.execute(select(Employee))
    employees = result.scalars().all()

    for i in range(3):
        curr_date = base_date + timedelta(days=i)
        db.add(ShiftConfig(date=curr_date, shift_type="PAGI", min_required=2))
        db.add(ShiftConfig(date=curr_date, shift_type="MALAM", min_required=2))

        for emp in employees:
            db.add(Availability(employee_id=emp.id, available_date=curr_date, shift_type="PAGI"))
            db.add(Availability(employee_id=emp.id, available_date=curr_date, shift_type="MALAM"))

    await db.commit()
    return {"message": "Data dummy berhasil di-inject! Silakan test endpoint /generate"}


@router.post("/generate")
async def generate_schedule(db: AsyncSession = Depends(get_db)):
    """Buat header schedule lalu jalankan optimasi di background."""
    service = ScheduleService(db)
    sched = await service.create_schedule_header()

    import asyncio

    asyncio.create_task(service.run_optimization(sched.id, {}))

    return {"schedule_id": sched.id, "message": "Optimization started"}


@router.get("/status/{schedule_id}")
async def get_status(schedule_id: int, db: AsyncSession = Depends(get_db)):
    service = ScheduleService(db)
    sched = await service.get_schedule_status(schedule_id)
    if not sched:
        raise HTTPException(status_code=404, detail="Schedule not found")

    return {
        "id": sched.id,
        "status": sched.status,
        "total_cost": sched.total_cost,
        "runtime_seconds": sched.runtime_seconds,
        "iterations_run": sched.iterations_run,
        "created_at": sched.created_at.isoformat() if sched.created_at else None,
    }


class SimpleExecuteRequest(BaseModel):
    employee_names: List[str] = Field(
        ...,
        min_length=1,
        description="Daftar nama karyawan; jumlah nama sama dengan total karyawan",
    )
    # Either provide shift_hours or shift_count_per_day (or both, but they must be consistent)
    shift_hours: Optional[int] = Field(
        None,
        gt=0,
        le=24,
        description="Jam kerja per-shift; misalnya 8 berarti 3 shift per hari jika konsisten",
    )
    shift_count_per_day: Optional[int] = Field(
        None,
        gt=0,
        le=24,
        description="Jumlah shift per hari (mis. 3 untuk 3 shift/hari)",
    )
    working_days_per_week: int = Field(
        ...,
        gt=0,
        le=7,
        description="Jumlah hari kerja dalam satu minggu",
    )
    start_date: date = Field(default_factory=date.today, description="Tanggal mulai jadwal")
    force_generate: bool = Field(
        False,
        description="Jika True, tetap generate jadwal walaupun tidak feasible."
    )


@router.post("/execute")
async def quick_execute(payload: SimpleExecuteRequest):
    """One-button execution: accept employee names, shift duration, and working days, then return a ready-to-render schedule table."""
    names = [name.strip() for name in payload.employee_names if name and name.strip()]
    if not names:
        raise HTTPException(status_code=400, detail="employee_names tidak boleh kosong")

    if len(names) != len(set(names)):
        raise HTTPException(status_code=400, detail="employee_names harus unik")

    # --- FEASIBILITY CHECK ---
    # Cek apakah jumlah pegawai cukup untuk kebutuhan shift minimum
    provided_hours = payload.shift_hours
    provided_count = payload.shift_count_per_day
    if provided_hours is None and provided_count is None:
        raise HTTPException(status_code=400, detail="Harus menyediakan shift_hours atau shift_count_per_day")

    if provided_hours is not None and provided_count is not None:
        if 24 % provided_hours != 0 or (24 // provided_hours) != provided_count:
            raise HTTPException(status_code=400, detail="shift_hours dan shift_count_per_day tidak konsisten")
        shift_hours = provided_hours
        shift_count_per_day = provided_count
    elif provided_count is not None:
        if 24 % provided_count != 0:
            raise HTTPException(status_code=400, detail="shift_count_per_day harus membagi 24 secara habis")
        shift_count_per_day = provided_count
        shift_hours = 24 // shift_count_per_day
    else:
        if 24 % provided_hours != 0:
            raise HTTPException(status_code=400, detail="shift_hours harus membagi 24 secara habis")
        shift_hours = provided_hours
        shift_count_per_day = 24 // shift_hours

    # Cek feasibility: jumlah pegawai minimal harus >= kebutuhan shift terbesar per hari
    min_employees_needed = shift_count_per_day  # Asumsi 1 pegawai per shift minimal
    if len(names) < min_employees_needed and not payload.force_generate:
        return {
            "feasibility_check": {
                "feasible": False,
                "warning": f"Jumlah pegawai ({len(names)}) kurang dari jumlah shift per hari ({shift_count_per_day}). Jadwal tidak feasible. Tetap lanjut generate?",
                "can_continue": True
            }
        }

    # ...existing code...

    employees = [
        SimpleNamespace(id=index + 1, name=name, max_shifts_per_week=payload.working_days_per_week)
        for index, name in enumerate(names)
    ]

    shift_labels = []
    for index in range(shift_count_per_day):
        start_hour = index * shift_hours
        end_hour = (index + 1) * shift_hours
        shift_labels.append(
            {
                "label": f"SHIFT {index + 1}",
                "time_range": f"{start_hour:02d}:00-{end_hour:02d}:00",
            }
        )

    shift_configs = {}
    availabilities = {}
    base_quota = len(employees) // shift_count_per_day
    remainder = len(employees) % shift_count_per_day

    for employee in employees:
        availabilities[employee.id] = {}

    for day_index in range(payload.working_days_per_week):
        current_date = payload.start_date + timedelta(days=day_index)
        shift_configs[current_date] = {}

        for shift_index, shift_meta in enumerate(shift_labels):
            required = max(1, base_quota + (1 if shift_index < remainder else 0))
            shift_type = shift_meta["label"]
            shift_configs[current_date][shift_type] = required

            for employee in employees:
                availabilities[employee.id].setdefault(current_date, []).append(shift_type)

    optimizer = SimulatedAnnealingScheduler(
        employees=employees,
        availabilities=availabilities,
        shift_configs=shift_configs,
        params={
            "initial_temperature": 3000.0,    
            "cooling_rate": 0.95,             
            "min_temperature": 0.1,         
            "max_iterations": 15000,         
        },
    )

    result = optimizer.optimize()
    best_state = result["schedule"]
    id_to_name = {employee.id: employee.name for employee in employees}

    table_rows = []
    for current_date in sorted(best_state.keys()):
        for shift_meta in shift_labels:
            shift_type = shift_meta["label"]
            assigned_ids = best_state[current_date].get(shift_type, [])
            table_rows.append(
                {
                    "date": current_date.isoformat(),
                    "shift": shift_type,
                    "hours": shift_meta["time_range"],
                    "employees": [id_to_name.get(employee_id, f"Employee {employee_id}") for employee_id in assigned_ids],
                    "employee_count": len(assigned_ids),
                }
            )

    # Prefer nanosecond precision when available and expose multiple formats for UI
    runtime_seconds = float(result.get("runtime_seconds", result.get("runtime", 0.0)))
    runtime_nanoseconds = int(result.get("runtime_nanoseconds", int(runtime_seconds * 1e9)))
    runtime_milliseconds = int(runtime_nanoseconds / 1_000_000)

    def _format_runtime(ns: int) -> str:
        # human-friendly formatting choosing best unit
        if ns < 1_000:
            return f"{ns} ns"
        if ns < 1_000_000:
            us = ns / 1_000
            return f"{us:.3f} μs"
        if ns < 1_000_000_000:
            ms = ns / 1_000_000
            return f"{ms:.3f} ms"
        s = ns / 1_000_000_000
        return f"{s:.6f} s"

    runtime_human = _format_runtime(runtime_nanoseconds)

    return {
        "input": {
            "employee_names": names,
            "shift_hours": shift_hours,
            "working_days_per_week": payload.working_days_per_week,
            "shift_count_per_day": shift_count_per_day,
        },
        "schedule": {
            "status": "COMPLETED",
            "total_cost": result["cost"],
            "runtime_seconds": runtime_seconds,
            "runtime_milliseconds": runtime_milliseconds,
            "runtime_nanoseconds": runtime_nanoseconds,
            "runtime_human": runtime_human,
            "iterations_run": result["iterations"],
        },
        "table": table_rows,
    }

