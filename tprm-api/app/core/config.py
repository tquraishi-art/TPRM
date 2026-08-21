from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_KEY: str
    ANTHROPIC_API_KEY: str
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    JWT_SECRET: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
