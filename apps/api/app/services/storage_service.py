"""
Storage service supporting Supabase Storage and Local Disk backends.

Provides upload, delete, and URL resolution for media files:
* In development/test: STORAGE_BACKEND="local" stores files under MEDIA_ROOT.
* In staging/production: STORAGE_BACKEND="supabase" stores files in Supabase Storage.
"""

from __future__ import annotations

import logging
import mimetypes
from pathlib import Path

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


def sanitize_object_path(path: str) -> str:
    """
    Sanitizes an object path to prevent directory traversal and invalid characters.
    Rejects any path containing '..' components.
    """
    clean = path.replace("\\", "/").strip().lstrip("/")
    parts = [p for p in clean.split("/") if p and p != "."]
    if any(p == ".." for p in parts):
        raise ValueError(f"Path traversal detected in object path: '{path}'")
    if not parts:
        raise ValueError("Object path cannot be empty")
    return "/".join(parts)


def _storage_base() -> str:
    """Return the Supabase Storage REST base URL."""
    return f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1"


def public_url(path: str) -> str:
    """
    Return the public URL for an object path based on the active STORAGE_BACKEND.
    """
    sanitized = sanitize_object_path(path)
    if settings.STORAGE_BACKEND == "local":
        return f"/media/{sanitized}"
    bucket = settings.SUPABASE_STORAGE_BUCKET
    return f"{_storage_base()}/object/public/{bucket}/{sanitized}"


def is_configured() -> bool:
    """Return True when the active storage backend is properly configured."""
    if settings.STORAGE_BACKEND == "local":
        return True
    return bool(
        settings.SUPABASE_URL
        and settings.SUPABASE_SERVICE_ROLE_KEY
        and settings.SUPABASE_STORAGE_BUCKET
    )


async def upload_file(
    object_path: str,
    content: bytes,
    content_type: str,
) -> str:
    """
    Upload content to the configured storage backend at object_path.
    Returns the public URL for the uploaded file.
    Raises RuntimeError on failure.
    """
    sanitized_path = sanitize_object_path(object_path)

    if settings.STORAGE_BACKEND == "local":
        try:
            root = Path(settings.RESOLVED_MEDIA_ROOT).resolve()
            target = (root / sanitized_path).resolve()
            if not str(target).startswith(str(root)):
                raise ValueError(f"Target path escapes media root: {sanitized_path}")
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(content)
            logger.info("Saved local media file to %s", target)
            return public_url(sanitized_path)
        except Exception as e:
            logger.error("Local storage upload failed for %s: %s", sanitized_path, e)
            raise RuntimeError(f"Local storage upload failed: {e}") from e

    # Supabase backend
    if not is_configured():
        raise RuntimeError(
            "Supabase Storage is not configured. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_STORAGE_BUCKET."
        )

    bucket = settings.SUPABASE_STORAGE_BUCKET
    url = f"{_storage_base()}/object/{bucket}/{sanitized_path}"
    headers = {
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": content_type,
        "x-upsert": "true",  # overwrite if same key uploaded again
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, content=content, headers=headers)

    if response.status_code not in (200, 201):
        logger.error(
            "Supabase Storage upload failed: status=%s body=%s",
            response.status_code,
            response.text[:300],
        )
        raise RuntimeError(f"Supabase Storage upload failed with status {response.status_code}")

    logger.info("Uploaded %s to Supabase bucket %s", sanitized_path, bucket)
    return public_url(sanitized_path)


async def delete_file(object_path: str) -> None:
    """
    Delete object_path from the configured storage backend.
    Logs a warning on failure but does not raise (idempotent cleanup).
    """
    try:
        sanitized_path = sanitize_object_path(object_path)
    except ValueError:
        return

    if settings.STORAGE_BACKEND == "local":
        try:
            root = Path(settings.RESOLVED_MEDIA_ROOT).resolve()
            target = (root / sanitized_path).resolve()
            if str(target).startswith(str(root)) and target.is_file():
                target.unlink(missing_ok=True)
                logger.info("Deleted local file %s", target)
        except Exception as e:
            logger.warning("Local storage delete warning for %s: %s", sanitized_path, e)
        return

    if not is_configured():
        return

    bucket = settings.SUPABASE_STORAGE_BUCKET
    url = f"{_storage_base()}/object/{bucket}/{sanitized_path}"
    headers = {
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.delete(url, headers=headers)

    if response.status_code not in (200, 204):
        logger.warning(
            "Supabase Storage delete warning: path=%s status=%s",
            sanitized_path,
            response.status_code,
        )
    else:
        logger.info("Deleted %s from Supabase bucket %s", sanitized_path, bucket)


def guess_mime(filename: str, fallback: str = "image/jpeg") -> str:
    """Best-effort MIME type from file extension."""
    mime, _ = mimetypes.guess_type(filename)
    return mime or fallback
