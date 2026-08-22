from fastapi import APIRouter

from app.api.v1.admin import (
    attributes as admin_attributes,
)
from app.api.v1.admin import (
    categories as admin_categories,
)
from app.api.v1.admin import (
    media as admin_media,
)
from app.api.v1.admin import (
    products as admin_products,
)
from app.api.v1.admin import (
    sections as admin_sections,
)
from app.api.v1.admin import (
    store as admin_store,
)
from app.api.v1.endpoints import health
from app.api.v1.public import (
    attributes as public_attributes,
)
from app.api.v1.public import (
    categories as public_categories,
)
from app.api.v1.public import (
    products as public_products,
)
from app.api.v1.public import (
    saved_items as public_saved_items,
)
from app.api.v1.public import (
    sections as public_sections,
)
from app.api.v1.public import (
    store as public_store,
)

api_router = APIRouter()

# Health probe
api_router.include_router(health.router, prefix="/health", tags=["health"])

# Public Routers (/api/v1/public/*)
public_router = APIRouter(prefix="/public")
public_router.include_router(public_store.router)
public_router.include_router(public_categories.router)
public_router.include_router(public_attributes.router)
public_router.include_router(public_products.router)
public_router.include_router(public_sections.router)
public_router.include_router(public_saved_items.router)
api_router.include_router(public_router)

# Admin Routers (/api/v1/admin/*)
admin_router = APIRouter(prefix="/admin")
admin_router.include_router(admin_store.router)
admin_router.include_router(admin_categories.router)
admin_router.include_router(admin_attributes.router)
admin_router.include_router(admin_products.router)
admin_router.include_router(admin_sections.router)
admin_router.include_router(admin_media.router)
api_router.include_router(admin_router)
