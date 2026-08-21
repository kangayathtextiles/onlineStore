import uuid
from collections.abc import Sequence

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.custom_section import CustomSection, CustomSectionItem
from app.repositories.base import BaseRepository


class CustomSectionRepository(BaseRepository[CustomSection]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(CustomSection, session)

    async def get_by_slug(self, slug: str) -> CustomSection | None:
        stmt = select(CustomSection).where(CustomSection.slug == slug)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_sections(self, active_only: bool = False) -> Sequence[CustomSection]:
        stmt = select(CustomSection).order_by(CustomSection.display_order)
        if active_only:
            stmt = stmt.where(CustomSection.is_active.is_(True))
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def clear_section_items(self, section_id: uuid.UUID) -> None:
        stmt = delete(CustomSectionItem).where(CustomSectionItem.section_id == section_id)
        await self.session.execute(stmt)
        await self.session.flush()

    async def add_section_items(
        self, items: list[CustomSectionItem]
    ) -> Sequence[CustomSectionItem]:
        self.session.add_all(items)
        await self.session.flush()
        return items
