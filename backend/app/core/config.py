from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database — constructed from shared platform vars
    DATABASE_URL: str

    # App secret
    JWT_SECRET: str

    # S3-compatible storage — mapped from shared MINIO_* vars
    STORAGE_ENDPOINT: str = ""
    STORAGE_ACCESS_KEY: str = "minioadmin"
    STORAGE_SECRET_KEY: str = "minioadmin"
    STORAGE_BUCKET: str = "openlog"
    STORAGE_REGION: str = "us-east-1"

    class Config:
        env_file = ".env"


settings = Settings()
