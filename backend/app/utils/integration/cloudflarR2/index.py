import io
import uuid

import boto3
from botocore.config import Config
from fastapi import HTTPException, UploadFile
from PIL import Image

from app.core.config import settings

s3 = boto3.client(
    "s3",
    endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=settings.R2_ACCESS_KEY_ID,
    aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
    region_name="auto",
    config=Config(signature_version="s3v4"),
)

EXT = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
BUCKET = settings.R2_BUCKET
MAX_SIZE = settings.MAX_AVATAR_SIZE_MB * 1024 * 1024


def upload_avatar(file: UploadFile) -> str:
    """Validate an uploaded image and store it in R2. Returns the object key.

    Synchronous on purpose: the service layer is sync, so the bytes are read
    straight off the SpooledTemporaryFile instead of awaiting UploadFile.read().
    """
    if file.content_type not in EXT:
        raise HTTPException(415, "File must be in png, jpeg or webp format")

    file.file.seek(0)
    data = file.file.read()
    if not data:
        raise HTTPException(400, "Uploaded file is empty")
    if len(data) > MAX_SIZE:
        raise HTTPException(
            413, f"File must be under {settings.MAX_AVATAR_SIZE_MB} MB"
        )

    try:
        # verify() only checks the header, so the decoder never runs on
        # untrusted pixel data.
        Image.open(io.BytesIO(data)).verify()
    except Exception:
        raise HTTPException(400, "Invalid image")

    key = f"avatars/{uuid.uuid4()}.{EXT[file.content_type]}"
    s3.put_object(
        Bucket=BUCKET, Key=key, Body=data, ContentType=file.content_type
    )
    return key


def delete_key(key: str) -> None:
    s3.delete_object(Bucket=BUCKET, Key=key)


def file_url(key: str) -> str:
    """Presigned GET url for a stored key. Already-absolute urls pass through."""
    if not key:
        return key
    if key.startswith("http://") or key.startswith("https://"):
        return key
    return s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": BUCKET, "Key": key},
        ExpiresIn=settings.R2_PRESIGNED_EXPIRY_SECONDS,
    )
