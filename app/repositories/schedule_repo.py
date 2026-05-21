from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models.employee import Employee, Availability
from app.models.shift import ShiftConfig
from app.models.schedule import Schedule, ShiftAssignment
from datetime import date
from typing import Dict, List

class ScheduleRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_employees(self) -> List[Employee]:
        result = await self.db.execute(select(Employee))
        return list(result.scalars().all())

    async def get_availabilities(self) -> Dict[int, Dict[date, List[str]]]:
        result = await self.db.execute(select(Availability))
        avails = result.scalars().all()
        # Format ke dict: {emp_id: {date: [shift_types]}}
        data = {}
        for a in avails:
            if a.employee_id not in data:
                data[a.employee_id] = {}
            if a.available_date not in data[a.employee_id]:
                data[a.employee_id][a.available_date] = []
            data[a.employee_id][a.available_date].append(a.shift_type)
        return data

    async def get_shift_configs(self) -> Dict[date, Dict[str, int]]:
        result = await self.db.execute(select(ShiftConfig))
        configs = result.scalars().all()
        # Format ke dict: {date: {shift_type: min_req}}
        data = {}
        for c in configs:
            if c.date not in data:
                data[c.date] = {}
            data[c.date][c.shift_type] = c.min_required
        return data

    async def create_schedule_header(self) -> Schedule:
        sched = Schedule(status="GENERATING")
        self.db.add(sched)
        await self.db.commit()
        await self.db.refresh(sched)
        return sched

    async def save_assignments(self, schedule_id: int, assignments_dict: dict):
        for dt, shifts in assignments_dict.items():
            for s_type, emp_ids in shifts.items():
                for emp_id in emp_ids:
                    assignment = ShiftAssignment(
                        schedule_id=schedule_id,
                        employee_id=emp_id,
                        date=dt,
                        shift_type=s_type
                    )
                    self.db.add(assignment)
        await self.db.commit()

    async def get_assignments(self, schedule_id: int):
        """Return list of assignments for a schedule as simple dicts."""
        result = await self.db.execute(select(ShiftAssignment).where(ShiftAssignment.schedule_id == schedule_id))
        assigns = result.scalars().all()
        out = []
        for a in assigns:
            out.append({
                "id": a.id,
                "employee_id": a.employee_id,
                "date": a.date.isoformat() if a.date else None,
                "shift_type": a.shift_type
            })
        return out