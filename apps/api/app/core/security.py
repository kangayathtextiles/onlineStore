"""
Security foundation module.
Full authentication and authorization implementations are reserved for Phase 06.
"""

import os
from typing import Any

from fastapi import UploadFile

from app.core.config import settings


def sanitize_log_data(data: dict[str, Any]) -> dict[str, Any]:
    """
    Sanitize sensitive keys from dictionary before logging.
    """
    sensitive_keys = {"password", "token", "secret", "authorization", "cookie", "api_key"}
    sanitized = {}
    for key, value in data.items():
        if any(sensitive in key.lower() for sensitive in sensitive_keys):
            sanitized[key] = "[REDACTED]"
        else:
            sanitized[key] = value
    return sanitized


async def validate_upload_file(
    file: UploadFile,
) -> tuple[bool, str, bytes, str]:
    """
    Validate an uploaded file by reading in chunks, enforcing size limits,
    and verifying actual magic bytes for image formats.
    Returns (is_valid, error_message, verified_bytes, verified_mime_type).
    """
    if not file.filename:
        return False, "File must have a valid filename.", b"", ""

    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if file.size and file.size > max_bytes:
        return False, f"File size exceeds maximum ({settings.MAX_UPLOAD_SIZE_MB} MB)", b"", ""

    allowed_extensions = [
        ext.strip().lower() for ext in settings.ALLOWED_IMAGE_EXTENSIONS.split(",")
    ]
    _, ext = os.path.splitext(file.filename)
    if ext.lower() not in allowed_extensions:
        return (
            False,
            f"File extension '{ext}' is not allowed. Allowed: {', '.join(allowed_extensions)}",
            b"",
            ""
        )

    content = bytearray()
    chunk_size = 1024 * 1024
    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        content.extend(chunk)
        if len(content) > max_bytes:
            return False, f"File size exceeds maximum ({settings.MAX_UPLOAD_SIZE_MB} MB)", b"", ""

    header = content[:12]
    mime_type = ""
    if header.startswith(b"\xff\xd8\xff"):
        mime_type = "image/jpeg"
    elif header.startswith(b"\x89PNG\r\n\x1a\n"):
        mime_type = "image/png"
    elif header.startswith(b"GIF87a") or header.startswith(b"GIF89a"):
        mime_type = "image/gif"
    elif header.startswith(b"RIFF") and header[8:12] == b"WEBP":
        mime_type = "image/webp"
    else:
        return False, "Invalid image content. File signature does not match an allowed image format.", b"", ""

    return True, "", bytes(content), mime_type
