"""
Supabase Storage service.

Provides upload / delete / URL resolution for media files stored in
Supabase Storage (public bucket: product-media).

Design decisions
----------------
* Uses the Supabase Storage REST API directly via httpx (no extra SDK
  dependency — httpx is already a transitive FastAPI dependency).
* Falls back to local-disk behaviour when SUPABASE_URL / SERVICE_ROLE_KEY
  are not configured (i.e. in local dev without Supabase credentials).
* The bucket is public, so public URLs are stable, CDN-friendly, and do
  NOT require signed tokens.
"""

from __future__ import annotations

import logging
import mimetypes

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Public URL helpers
# ---------------------------------------------------------------------------

def _storage_base() -> str:
    """Return the Supabase Storage REST base URL."""
    return f"{settings.SUPABASE_URL}/storage/v1"


def public_url(path: str) -> str:
    """
    Return the stable, CDN-served public URL for an object in the bucket.

    path — the object key stored in the bucket, e.g. ``products/abc123.jpg``
    """
    bucket = settings.SUPABASE_STORAGE_BUCKET
    return f"{_storage_base()}/object/public/{bucket}/{path}"


# ---------------------------------------------------------------------------
# Core operations
# ---------------------------------------------------------------------------

def is_configured() -> bool:
    """Return True when Supabase Storage credentials are present."""
    return bool(settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY)


async def upload_file(
    object_path: str,
    content: bytes,
    content_type: str,
) -> str:
    """
    Upload *content* to Supabase Storage at *object_path*.

    Returns the public URL for the uploaded file.

    Raises RuntimeError on failure.
    """
    if not is_configured():
        raise RuntimeError(
            "Supabase Storage is not configured. "
            "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
        )

    bucket = settings.SUPABASE_STORAGE_BUCKET
    url = f"{_storage_base()}/object/{bucket}/{object_path}"
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
        raise RuntimeError(
            f"Supabase Storage upload failed with status {response.status_code}"
        )

    logger.info("Uploaded %s to bucket %s", object_path, bucket)
    return public_url(object_path)


async def delete_file(object_path: str) -> None:
    """
    Delete *object_path* from Supabase Storage.

    Logs a warning on failure but does NOT raise — a missing file on
    delete is not a hard error (idempotent cleanup).
    """
    if not is_configured():
        return

    bucket = settings.SUPABASE_STORAGE_BUCKET
    url = f"{_storage_base()}/object/{bucket}/{object_path}"
    headers = {
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.delete(url, headers=headers)

    if response.status_code not in (200, 204):
        logger.warning(
            "Supabase Storage delete warning: path=%s status=%s",
            object_path,
            response.status_code,
        )
    else:
        logger.info("Deleted %s from bucket %s", object_path, bucket)


def guess_mime(filename: str, fallback: str = "image/jpeg") -> str:
    """Best-effort MIME type from file extension."""
    mime, _ = mimetypes.guess_type(filename)
    return mime or fallback
