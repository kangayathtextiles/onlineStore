from typing import Any


class AppException(Exception):
    """Base application exception with machine-readable error code."""

    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_ERROR",
        status_code: int = 500,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}


class EntityNotFoundException(AppException):
    """Raised when a requested resource does not exist."""

    def __init__(
        self,
        entity_name: str,
        identifier: Any,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            message=f"{entity_name} with identifier '{identifier}' was not found.",
            code=f"{entity_name.upper()}_NOT_FOUND",
            status_code=404,
            details=details,
        )


class DuplicateResourceException(AppException):
    """Raised when creating a resource violates uniqueness constraints."""

    def __init__(
        self,
        resource_name: str,
        field: str,
        value: Any,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            message=f"{resource_name} with {field}='{value}' already exists.",
            code=f"DUPLICATE_{resource_name.upper()}_{field.upper()}",
            status_code=409,
            details=details,
        )


class InvariantViolationException(AppException):
    """Raised when a domain rule or invariant is violated."""

    def __init__(
        self,
        message: str,
        code: str = "INVARIANT_VIOLATION",
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            message=message,
            code=code,
            status_code=400,
            details=details,
        )


class CategoryHasDependenciesException(AppException):
    """Raised when trying to delete a category that still contains subcategories or products."""

    def __init__(
        self,
        category_name: str,
        active_subcategories: int,
        active_products: int,
    ) -> None:
        super().__init__(
            message=(
                f"Cannot delete category '{category_name}' because it contains "
                f"{active_subcategories} subcategories and {active_products} active products."
            ),
            code="CATEGORY_HAS_ACTIVE_DEPENDENCIES",
            status_code=409,
            details={
                "active_subcategories": active_subcategories,
                "active_products": active_products,
            },
        )


class ImageLimitExceededException(AppException):
    """Raised when attempting to attach more than 6 images to a product."""

    def __init__(self, current_count: int, limit: int = 6) -> None:
        super().__init__(
            message=f"Product cannot have more than {limit} images (currently has {current_count}).",
            code="IMAGE_LIMIT_EXCEEDED",
            status_code=400,
            details={"current_count": current_count, "max_limit": limit},
        )
