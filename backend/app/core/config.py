from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str

    # S3-compatible storage (MinIO locally, AWS S3 / Cloudflare R2 in prod)
    STORAGE_ENDPOINT: str = ""       # blank = real AWS; set to http://minio:9000 for local
    STORAGE_ACCESS_KEY: str = "minioadmin"
    STORAGE_SECRET_KEY: str = "minioadmin"
    STORAGE_BUCKET: str = "openlog"
    STORAGE_REGION: str = "us-east-1"

    class Config:
        env_file = ".env"


settings = Settings()
