import os
import uuid

from fastapi import APIRouter, Depends, File, UploadFile
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.dependencies import AdminUserContext, get_async_session, get_current_admin_user
from app.core.exceptions import ValidationException
from app.core.security import validate_upload_file
from app.models.stored_media import StoredMedia

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
    summary="Upload image file from device",
)
async def upload_media_file(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> MediaUploadResponse:
    if not file.filename:
        raise ValidationException("File must have a valid filename.")

    # Read content to check size and validate
    content = await file.read()
    file_size = len(content)

    is_valid, err_msg = validate_upload_file(file.filename, file_size)
    if not is_valid:
        raise ValidationException(err_msg)

    # Generate unique collision-free filename
    _, ext = os.path.splitext(file.filename)
    unique_filename = f"{uuid.uuid4().hex}{ext.lower()}"

    target_dir = os.path.join(settings.RESOLVED_MEDIA_ROOT, "uploads")
    os.makedirs(target_dir, exist_ok=True)
    target_path = os.path.join(target_dir, unique_filename)

    with open(target_path, "wb") as f:
        f.write(content)

    # Persist in PostgreSQL StoredMedia for zero-loss container restarts
    stored_media = StoredMedia(
        filename=unique_filename,
        category="uploads",
        content_type=file.content_type or "image/jpeg",
        data=content,
        size_bytes=file_size,
    )
    session.add(stored_media)
    await session.commit()

    return MediaUploadResponse(
        url=f"/media/uploads/{unique_filename}",
        filename=unique_filename,
        content_type=file.content_type,
        size_bytes=file_size,
    )
