"""
Storage integration — uses an S3-compatible backend (MinIO locally, Supabase Storage / AWS S3 in prod).
Controlled by env vars:
  STORAGE_ENDPOINT  e.g. http://minio:9000  (leave blank for real AWS S3)
  STORAGE_ACCESS_KEY
  STORAGE_SECRET_KEY
  STORAGE_BUCKET    (default: openlog)
  STORAGE_REGION    (default: us-east-1)
"""
import boto3
from botocore.exceptions import ClientError

from app.core.config import settings

BUCKET = settings.STORAGE_BUCKET

_s3 = None
_bucket_ensured = False


def _get_client():
    global _s3
    if _s3 is None:
        kwargs = dict(
            aws_access_key_id=settings.STORAGE_ACCESS_KEY,
            aws_secret_access_key=settings.STORAGE_SECRET_KEY,
            region_name=settings.STORAGE_REGION,
        )
        if settings.STORAGE_ENDPOINT:
            kwargs["endpoint_url"] = settings.STORAGE_ENDPOINT
        _s3 = boto3.client("s3", **kwargs)
    return _s3


def _ensure_bucket():
    global _bucket_ensured
    if _bucket_ensured:
        return
    s3 = _get_client()
    try:
        s3.head_bucket(Bucket=BUCKET)
    except ClientError as e:
        code = e.response["Error"]["Code"]
        if code in ("NoSuchBucket", "404"):
            s3.create_bucket(Bucket=BUCKET)
        # BucketAlreadyOwnedByYou / BucketAlreadyExists → already there, ignore
    _bucket_ensured = True


def upload(path: str, content: str) -> None:
    _ensure_bucket()
    _get_client().put_object(Bucket=BUCKET, Key=path, Body=content.encode())


def download(path: str) -> str:
    _ensure_bucket()
    resp = _get_client().get_object(Bucket=BUCKET, Key=path)
    return resp["Body"].read().decode()
