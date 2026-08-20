"""
Security foundation module.
Full authentication and authorization implementations are reserved for Phase 06.
"""

from typing import Any


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
