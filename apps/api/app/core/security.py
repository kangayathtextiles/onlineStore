"""
Security foundation module.
Full authentication and authorization implementations are reserved for Phase 06.
"""

import base64
import hashlib
import hmac
import json
import os
import secrets
import threading
import time
from collections import defaultdict
from typing import Any

from fastapi import UploadFile

from app.core.config import settings


def verify_admin_api_key(provided_key: str | None) -> bool:
    """
    Constant-time comparison to protect against timing attacks.
    """
    if not provided_key or not settings.ADMIN_API_KEY:
        return False
    return secrets.compare_digest(
        provided_key.encode("utf-8"),
        settings.ADMIN_API_KEY.encode("utf-8"),
    )


def create_admin_session_token(expires_in_seconds: int | None = None) -> str:
    """
    Creates a cryptographically signed HMAC-SHA256 session token with an expiration timestamp.
    Format: base64url(payload).base64url(signature)
    Zero external dependencies, tamper-proof, time-bound.
    """
    duration = expires_in_seconds or settings.ADMIN_SESSION_EXPIRE_SECONDS
    exp = int(time.time()) + duration
    payload_dict = {
        "sub": "admin",
        "exp": exp,
        "nonce": secrets.token_hex(8),
    }
    payload_bytes = json.dumps(payload_dict, separators=(",", ":")).encode("utf-8")
    payload_b64 = base64.urlsafe_b64encode(payload_bytes).decode("ascii").rstrip("=")

    signature = hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        payload_b64.encode("ascii"),
        hashlib.sha256,
    ).digest()
    sig_b64 = base64.urlsafe_b64encode(signature).decode("ascii").rstrip("=")

    return f"{payload_b64}.{sig_b64}"


def verify_admin_session_token(token: str | None) -> dict[str, Any] | None:
    """
    Verifies the HMAC signature and expiration timestamp of an admin session token.
    Returns the decoded token payload dictionary if valid, None otherwise.
    """
    if not token or "." not in token:
        return None

    try:
        parts = token.split(".")
        if len(parts) != 2:
            return None
        payload_b64, sig_b64 = parts

        expected_sig = hmac.new(
            settings.SECRET_KEY.encode("utf-8"),
            payload_b64.encode("ascii"),
            hashlib.sha256,
        ).digest()

        padded_sig = sig_b64 + "=" * (-len(sig_b64) % 4)
        actual_sig = base64.urlsafe_b64decode(padded_sig.encode("ascii"))

        if not secrets.compare_digest(actual_sig, expected_sig):
            return None

        padded_payload = payload_b64 + "=" * (-len(payload_b64) % 4)
        payload_bytes = base64.urlsafe_b64decode(padded_payload.encode("ascii"))
        payload: dict[str, Any] = json.loads(payload_bytes.decode("utf-8"))

        exp = payload.get("exp")
        if not isinstance(exp, (int, float)) or time.time() > exp:
            return None

        if payload.get("sub") != "admin":
            return None

        return payload
    except Exception:
        return None


class LoginRateLimiter:
    """
    In-memory, thread-safe sliding window rate limiter for login attempts.
    Zero external dependencies, highly efficient (<1MB RAM for thousands of IPs).
    """

    def __init__(self, max_attempts: int = 5, window_seconds: int = 300) -> None:
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self._attempts: dict[str, list[float]] = defaultdict(list)
        self._lock = threading.Lock()

    def is_rate_limited(self, ip: str) -> bool:
        now = time.time()
        with self._lock:
            timestamps = self._attempts.get(ip, [])
            valid_timestamps = [t for t in timestamps if now - t < self.window_seconds]
            self._attempts[ip] = valid_timestamps
            return len(valid_timestamps) >= self.max_attempts

    def record_failed_attempt(self, ip: str) -> None:
        now = time.time()
        with self._lock:
            self._attempts[ip].append(now)

    def reset(self, ip: str) -> None:
        with self._lock:
            self._attempts.pop(ip, None)

    def get_retry_after(self, ip: str) -> int:
        now = time.time()
        with self._lock:
            timestamps = self._attempts.get(ip, [])
            if not timestamps:
                return 0
            oldest_relevant = min(t for t in timestamps if now - t < self.window_seconds)
            return max(1, int(self.window_seconds - (now - oldest_relevant)))


login_rate_limiter = LoginRateLimiter(max_attempts=5, window_seconds=300)


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
            "",
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
        return (
            False,
            "Invalid image content. File signature does not match an allowed image format.",
            b"",
            "",
        )

    return True, "", bytes(content), mime_type
