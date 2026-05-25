# Allow browser-based frontend to call API during local development
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base
from app.api.v1 import schedules
# Import employees.py juga kalau sudah dibikin rutenya

app = FastAPI(title="Scheduly")

# CORS: allow local frontend dev server origins during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # permissive for local development only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    # Buat tabel otomatis tiap kali aplikasi nyala (bisa diganti alembic di production)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

app.include_router(schedules.router, prefix="/api/v1")