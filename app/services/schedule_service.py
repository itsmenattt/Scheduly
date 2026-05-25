from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.repositories.schedule_repo import ScheduleRepository
from app.services.sa_optimizer import SimulatedAnnealingScheduler
from app.models.schedule import Schedule

class ScheduleService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ScheduleRepository(db)

    async def create_schedule_header(self):
        return await self.repo.create_schedule_header()

    async def run_optimization(self, schedule_id: int, config_dict: dict):
        employees = await self.repo.get_all_employees()
        availabilities = await self.repo.get_availabilities()
        shift_configs = await self.repo.get_shift_configs()
        
        optimizer = SimulatedAnnealingScheduler(
            employees=employees,
            availabilities=availabilities,
            shift_configs=shift_configs,
            params=config_dict
        )
        
        result = optimizer.optimize()

        # Simpan state akhir ke DB
        await self.repo.save_assignments(schedule_id, result["schedule"])

        # Prefer nanosecond precision if available from optimizer
        runtime_seconds = float(result.get("runtime_seconds", result.get("runtime", 0.0)))
        runtime_nanoseconds = int(result.get("runtime_nanoseconds", int(runtime_seconds * 1e9)))

        await self.db.execute(
            update(Schedule)
            .where(Schedule.id == schedule_id)
            .values(
                status="COMPLETED",
                total_cost=result["cost"],
                runtime_seconds=runtime_seconds,
                iterations_run=result["iterations"]
            )
        )
        await self.db.commit()

    async def get_schedule_status(self, schedule_id: int):
        result = await self.db.execute(select(Schedule).where(Schedule.id == schedule_id))
        return result.scalar_one_or_none()