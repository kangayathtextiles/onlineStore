from enum import StrEnum


class LifecycleState(StrEnum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    HIDDEN = "HIDDEN"
    ARCHIVED = "ARCHIVED"


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
