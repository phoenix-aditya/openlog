from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SUPABASE_URL: str
    SUPABASE_KEY: str
    JWT_SECRET: str
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str = "http://localhost:3000/auth/callback"

    # S3-compatible storage (MinIO locally, Supabase Storage / AWS S3 in prod)
    STORAGE_ENDPOINT: str = ""          # e.g. http://minio:9000 — blank = real AWS
    STORAGE_ACCESS_KEY: str = "minioadmin"
    STORAGE_SECRET_KEY: str = "minioadmin"
    STORAGE_BUCKET: str = "openlog"
    STORAGE_REGION: str = "us-east-1"

    class Config:
        env_file = ".env"


settings = Settings()
