from fastapi import FastAPI
from app.db.database import engine, Base
from app.api.v1 import schedules
# Import employees.py juga kalau sudah dibikin rutenya

app = FastAPI(title="Scheduly")

@app.on_event("startup")
async def startup():
    # Buat tabel otomatis tiap kali aplikasi nyala (bisa diganti alembic di production)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

app.include_router(schedules.router, prefix="/api/v1")