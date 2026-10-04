import uuid

from fastapi import APIRouter, Depends, File, UploadFile
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import AdminUserContext, get_async_session, get_current_admin_user
from app.core.exceptions import ValidationException
from app.core.security import validate_upload_file
from app.services import storage_service

router = APIRouter(prefix="/media", tags=["Admin Media"])


class MediaUploadResponse(BaseModel):
    url: str
    filename: str
    content_type: str | None = None
    size_bytes: int


@router.post(
    "/upload",
    response_model=MediaUploadResponse,
    status_code=201,
    summary="Upload image file to Supabase Storage",
)
async def upload_media_file(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> MediaUploadResponse:
    is_valid, err_msg, content, mime_type = await validate_upload_file(file)
    if not is_valid:
        raise ValidationException(err_msg)

    file_size = len(content)
    ext = (file.filename or "file.jpg").rsplit(".", 1)[-1].lower()
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    object_path = f"uploads/{unique_filename}"

    public_url = await storage_service.upload_file(object_path, content, mime_type)

    return MediaUploadResponse(
        url=public_url,
        filename=unique_filename,
        content_type=mime_type,
        size_bytes=file_size,
    )
