import uuid

from pydantic import Field

from app.schemas.common import BaseSchema


class SizeOptionDTO(BaseSchema):
    id: uuid.UUID
    name: str = Field(min_length=1, max_length=50)
    display_order: int = 0


class SizeOptionCreate(BaseSchema):
    name: str = Field(min_length=1, max_length=50)
    display_order: int = 0


class SizeOptionUpdate(BaseSchema):
    name: str | None = Field(default=None, min_length=1, max_length=50)
    display_order: int | None = None


class ColorOptionDTO(BaseSchema):
    id: uuid.UUID
    name: str = Field(min_length=1, max_length=50)
    hex_code: str | None = Field(default=None, max_length=7)
    display_order: int = 0


class ColorOptionCreate(BaseSchema):
    name: str = Field(min_length=1, max_length=50)
    hex_code: str | None = Field(default=None, max_length=7)
    display_order: int = 0


class ColorOptionUpdate(BaseSchema):
    name: str | None = Field(default=None, min_length=1, max_length=50)
    hex_code: str | None = Field(default=None, max_length=7)
    display_order: int | None = None
