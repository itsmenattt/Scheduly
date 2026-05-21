from pydantic_settings import BaseSettings
import os


class Settings(BaseSettings):
    PROJECT_NAME: str = "Shift Scheduler API"
    # Prefer explicit DATABASE_URL from env; fall back to POSTGRES_* vars
    DATABASE_URL: str | None = None
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str | None = None
    POSTGRES_DB: str = "shift_db"

    class Config:
        env_file = ".env"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.DATABASE_URL:
            pw = self.POSTGRES_PASSWORD or ""
            self.DATABASE_URL = (
                f"postgresql+asyncpg://{self.POSTGRES_USER}:{pw}@db:5432/{self.POSTGRES_DB}"
            )


settings = Settings()