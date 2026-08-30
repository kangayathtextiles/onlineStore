import re
import secrets
import string
from datetime import UTC, datetime


def _sanitize_slug_code(slug: str | None, default: str = "GEN") -> str:
    """Extract a 3-character uppercase alphanumeric code from a category/subcategory slug."""
    if not slug:
        return default
    clean = re.sub(r"[^A-Za-z0-9]", "", slug).upper()
    if len(clean) >= 3:
        return clean[:3]
    return clean.ljust(3, "X")


def generate_style_code(
    category_slug: str | None,
    subcategory_slug: str | None,
    created_at: datetime | None = None,
) -> str:
    """
    Generate a deterministic, human-readable, unique Style Code.
    Format: KGY-{CAT3}-{SUB3}-{YYMMDD}-{RAND4}
    Example: KGY-WOM-SAR-260830-8F2A
    """
    dt = created_at or datetime.now(UTC)
    date_part = dt.strftime("%y%m%d")

    cat_part = _sanitize_slug_code(category_slug, default="GEN")
    sub_part = _sanitize_slug_code(subcategory_slug, default="ALL")

    # 4-character collision-resistant uppercase alphanumeric token
    alphabet = string.ascii_uppercase + string.digits
    rand_part = "".join(secrets.choice(alphabet) for _ in range(4))

    return f"KGY-{cat_part}-{sub_part}-{date_part}-{rand_part}"


def generate_qr_code() -> str:
    """
    Generate a unique machine-readable QR Code token.
    Format: KGY-QR-{8_HEX}
    Example: KGY-QR-8F3B9A1C
    """
    token = secrets.token_hex(4).upper()
    return f"KGY-QR-{token}"
