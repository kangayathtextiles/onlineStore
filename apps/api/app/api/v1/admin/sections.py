import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import AdminUserContext, get_async_session, get_current_admin_user
from app.schemas.common import SuccessResponse
from app.schemas.custom_section import (
    AdminSectionResponse,
    SectionCreateRequest,
    SectionItemReorderRequest,
    SectionUpdateRequest,
)
from app.services.custom_section_service import CustomSectionService

router = APIRouter(prefix="/sections", tags=["Admin Sections"])


@router.get(
    "", response_model=list[AdminSectionResponse], summary="List all custom promotional sections"
)
async def list_admin_sections(
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> list[AdminSectionResponse]:
    service = CustomSectionService(session)
    return await service.list_admin_sections()


@router.post(
    "",
    response_model=AdminSectionResponse,
    status_code=201,
    summary="Create a new promotional custom section",
)
async def create_admin_section(
    req: SectionCreateRequest,
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> AdminSectionResponse:
    service = CustomSectionService(session)
    return await service.create_section(req)


@router.get(
    "/{section_id}",
    response_model=AdminSectionResponse,
    summary="Get section details with curated products",
)
async def get_admin_section(
    section_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> AdminSectionResponse:
    service = CustomSectionService(session)
    return await service.get_admin_section_by_id(section_id)


@router.put("/{section_id}", response_model=AdminSectionResponse, summary="Update section metadata")
async def update_admin_section(
    section_id: uuid.UUID,
    req: SectionUpdateRequest,
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> AdminSectionResponse:
    service = CustomSectionService(session)
    return await service.update_section(section_id, req)


@router.put(
    "/{section_id}/reorder",
    response_model=AdminSectionResponse,
    summary="Curate and reorder products within section",
)
async def reorder_section_items(
    section_id: uuid.UUID,
    req: SectionItemReorderRequest,
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> AdminSectionResponse:
    service = CustomSectionService(session)
    return await service.reorder_section_items(section_id, req)


@router.delete("/{section_id}", response_model=SuccessResponse, summary="Delete custom section")
async def delete_admin_section(
    section_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> SuccessResponse:
    service = CustomSectionService(session)
    await service.delete_section(section_id)
    return SuccessResponse(message="Custom section deleted successfully.")
