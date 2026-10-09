import uuid
from collections.abc import Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateResourceException, EntityNotFoundException
from app.models.attribute import ColorOption, SizeOption
from app.repositories.attribute_repository import AttributeRepository
from app.schemas.attribute import (
    ColorOptionCreate,
    ColorOptionUpdate,
    SizeOptionCreate,
    SizeOptionUpdate,
)


class AttributeService:
    """Service layer managing size and color dictionary attributes.

    Handles business rules, duplicate validation, and transaction coordination.
    """

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = AttributeRepository(session)

    # --- Sizes ---
    async def list_sizes(self) -> Sequence[SizeOption]:
        """List all clothing size options ordered by display order."""
        return await self.repo.list_sizes()

    async def get_size_by_id(self, size_id: uuid.UUID) -> SizeOption:
        """Retrieve a size option by ID or raise EntityNotFoundException."""
        size = await self.repo.get_size_by_id(size_id)
        if not size:
            raise EntityNotFoundException("SizeOption", size_id)
        return size

    async def create_size(self, data: SizeOptionCreate) -> SizeOption:
        """Create a new clothing size after verifying uniqueness."""
        existing = await self.repo.get_size_by_name(data.name)
        if existing:
            raise DuplicateResourceException("SizeOption", "name", data.name)

        size = SizeOption(name=data.name, display_order=data.display_order)
        created = await self.repo.create_size(size)
        await self.session.commit()
        return created

    async def update_size(self, size_id: uuid.UUID, data: SizeOptionUpdate) -> SizeOption:
        """Update an existing size option label or display order."""
        size = await self.get_size_by_id(size_id)

        if data.name is not None:
            existing = await self.repo.get_size_by_name(data.name)
            if existing and existing.id != size_id:
                raise DuplicateResourceException("SizeOption", "name", data.name)
            size.name = data.name

        if data.display_order is not None:
            size.display_order = data.display_order

        await self.session.commit()
        return size

    async def delete_size(self, size_id: uuid.UUID) -> None:
        """Delete a size option by ID."""
        size = await self.get_size_by_id(size_id)
        await self.repo.delete_size(size)
        await self.session.commit()

    # --- Colors ---
    async def list_colors(self) -> Sequence[ColorOption]:
        """List all garment color options ordered by display order."""
        return await self.repo.list_colors()

    async def get_color_by_id(self, color_id: uuid.UUID) -> ColorOption:
        """Retrieve a color option by ID or raise EntityNotFoundException."""
        color = await self.repo.get_color_by_id(color_id)
        if not color:
            raise EntityNotFoundException("ColorOption", color_id)
        return color

    async def create_color(self, data: ColorOptionCreate) -> ColorOption:
        """Create a new color option after verifying uniqueness."""
        existing = await self.repo.get_color_by_name(data.name)
        if existing:
            raise DuplicateResourceException("ColorOption", "name", data.name)

        color = ColorOption(
            name=data.name, hex_code=data.hex_code, display_order=data.display_order
        )
        created = await self.repo.create_color(color)
        await self.session.commit()
        return created

    async def update_color(self, color_id: uuid.UUID, data: ColorOptionUpdate) -> ColorOption:
        """Update an existing color option name, hex code, or display order."""
        color = await self.get_color_by_id(color_id)

        if data.name is not None:
            existing = await self.repo.get_color_by_name(data.name)
            if existing and existing.id != color_id:
                raise DuplicateResourceException("ColorOption", "name", data.name)
            color.name = data.name

        if data.hex_code is not None:
            color.hex_code = data.hex_code

        if data.display_order is not None:
            color.display_order = data.display_order

        await self.session.commit()
        return color

    async def delete_color(self, color_id: uuid.UUID) -> None:
        """Delete a color option by ID."""
        color = await self.get_color_by_id(color_id)
        await self.repo.delete_color(color)
        await self.session.commit()
