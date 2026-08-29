from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import LifecycleState
from app.repositories.saved_item_repository import SavedItemRepository
from app.schemas.saved_item import (
    SavedItemAvailabilityDTO,
    SavedItemBatchQueryRequest,
    SavedItemSyncRequest,
    SavedItemSyncResponse,
)
from app.services.product_service import ProductService


class SavedItemService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = SavedItemRepository(session)
        self.product_service = ProductService(session)

    async def sync_saved_items(self, req: SavedItemSyncRequest) -> SavedItemSyncResponse:
        collection = await self.repo.get_or_create_collection(req.session_token)
        await self.repo.sync_items(collection.id, req.product_ids)
        await self.session.commit()

        # Query products
        products = await self.repo.get_products_by_ids(req.product_ids)
        global_show_prices = await self.product_service.get_global_show_prices()
        public_products = [
            self.product_service.map_to_public_summary(p, global_show_prices=global_show_prices)
            for p in products
            if p.lifecycle_state == LifecycleState.PUBLISHED
        ]

        return SavedItemSyncResponse(
            session_token=req.session_token,
            items=public_products,
            total_saved=len(public_products),
        )

    async def get_saved_items_availability(
        self, req: SavedItemBatchQueryRequest
    ) -> list[SavedItemAvailabilityDTO]:
        products = await self.repo.get_products_by_ids(req.product_ids)
        results: list[SavedItemAvailabilityDTO] = []

        for p in products:
            primary_img = (
                next((img.url for img in p.images if img.is_primary), None) if p.images else None
            )
            results.append(
                SavedItemAvailabilityDTO(
                    product_id=p.id,
                    product_name=p.name,
                    product_slug=p.slug,
                    is_available=self.product_service.calculate_availability(p),
                    primary_image_url=primary_img,
                )
            )
        return results
