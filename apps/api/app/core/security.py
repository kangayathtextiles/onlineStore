"""
Security foundation module.
Full authentication and authorization implementations are reserved for Phase 06.
"""

import os
from typing import Any

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


def validate_upload_file(
    filename: str,
    file_size_bytes: int,
) -> tuple[bool, str]:
    """
    Validate an uploaded file against allowed extensions and size limits.
    Returns (is_valid, error_message).
    """
    # Validate file extension
    allowed_extensions = [
        ext.strip().lower() for ext in settings.ALLOWED_IMAGE_EXTENSIONS.split(",")
    ]
    _, ext = os.path.splitext(filename)
    if ext.lower() not in allowed_extensions:
        return (
            False,
            f"File extension '{ext}' is not allowed. Allowed: {', '.join(allowed_extensions)}",
        )

    # Validate file size
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if file_size_bytes > max_bytes:
        return (
            False,
            f"File size ({file_size_bytes} bytes) exceeds maximum ({settings.MAX_UPLOAD_SIZE_MB} MB)",
        )

    return True, ""
