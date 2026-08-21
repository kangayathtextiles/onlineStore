import uuid
from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.attribute import ColorOption, SizeOption


class AttributeRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    # Sizes
    async def get_size_by_id(self, size_id: uuid.UUID) -> SizeOption | None:
        return await self.session.get(SizeOption, size_id)

    async def get_size_by_name(self, name: str) -> SizeOption | None:
        stmt = select(SizeOption).where(SizeOption.name == name)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def list_sizes(self) -> Sequence[SizeOption]:
        stmt = select(SizeOption).order_by(SizeOption.display_order)
        return (await self.session.execute(stmt)).scalars().all()

    async def create_size(self, size: SizeOption) -> SizeOption:
        self.session.add(size)
        await self.session.flush()
        return size

    async def delete_size(self, size: SizeOption) -> None:
        await self.session.delete(size)
        await self.session.flush()

    # Colors
    async def get_color_by_id(self, color_id: uuid.UUID) -> ColorOption | None:
        return await self.session.get(ColorOption, color_id)

    async def get_color_by_name(self, name: str) -> ColorOption | None:
        stmt = select(ColorOption).where(ColorOption.name == name)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def list_colors(self) -> Sequence[ColorOption]:
        stmt = select(ColorOption).order_by(ColorOption.display_order)
        return (await self.session.execute(stmt)).scalars().all()

    async def create_color(self, color: ColorOption) -> ColorOption:
        self.session.add(color)
        await self.session.flush()
        return color

    async def delete_color(self, color: ColorOption) -> None:
        await self.session.delete(color)
        await self.session.flush()
