from enum import StrEnum


class LifecycleState(StrEnum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    HIDDEN = "HIDDEN"
    ARCHIVED = "ARCHIVED"


class OperationalStatus(StrEnum):
    AVAILABLE = "AVAILABLE"
    SOLD_OUT = "SOLD_OUT"
    DAMAGED = "DAMAGED"
    RETIRED = "RETIRED"


class QRStatus(StrEnum):
    ACTIVE = "ACTIVE"
    RELEASED = "RELEASED"


class LifecycleEventType(StrEnum):
    CREATED = "CREATED"
    QR_ASSIGNED = "QR_ASSIGNED"
    SOLD_OUT = "SOLD_OUT"
    DAMAGED = "DAMAGED"
    RETURNED = "RETURNED"
    RETIRED = "RETIRED"
    QR_RELEASED = "QR_RELEASED"


class OverrideMode(StrEnum):
    AUTO = "AUTO"
    FORCE_OPEN = "FORCE_OPEN"
    FORCE_CLOSED = "FORCE_CLOSED"


class DayOfWeek(StrEnum):
    MONDAY = "MONDAY"
    TUESDAY = "TUESDAY"
    WEDNESDAY = "WEDNESDAY"
    THURSDAY = "THURSDAY"
    FRIDAY = "FRIDAY"
    SATURDAY = "SATURDAY"
    SUNDAY = "SUNDAY"
