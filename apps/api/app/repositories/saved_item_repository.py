import uuid
from collections.abc import Sequence

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product
from app.models.saved_item import SavedItem, SavedItemCollection
from app.repositories.base import BaseRepository


class SavedItemRepository(BaseRepository[SavedItemCollection]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(SavedItemCollection, session)

    async def get_by_session_token(self, token: str) -> SavedItemCollection | None:
        stmt = select(SavedItemCollection).where(SavedItemCollection.session_token == token)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_or_create_collection(self, token: str) -> SavedItemCollection:
        collection = await self.get_by_session_token(token)
        if not collection:
            collection = SavedItemCollection(session_token=token)
            self.session.add(collection)
            await self.session.flush()
        return collection

    async def sync_items(self, collection_id: uuid.UUID, product_ids: list[uuid.UUID]) -> None:
        # Clear existing
        await self.session.execute(
            delete(SavedItem).where(SavedItem.collection_id == collection_id)
        )
        # Add new
        new_items = [
            SavedItem(collection_id=collection_id, product_id=pid) for pid in set(product_ids)
        ]
        self.session.add_all(new_items)
        await self.session.flush()

    async def get_products_by_ids(self, product_ids: list[uuid.UUID]) -> Sequence[Product]:
        if not product_ids:
            return []
        stmt = select(Product).where(Product.id.in_(product_ids))
        result = await self.session.execute(stmt)
        return result.scalars().all()
