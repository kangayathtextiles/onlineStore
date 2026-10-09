"""
Pure transformation functions and presentation mappers for products, variants, and availability.
Shared across ProductService, ProductMediaService, QRLifecycleService, and catalog services.
"""

from app.models.product import Product
from app.schemas.attribute import ColorOptionDTO, SizeOptionDTO
from app.schemas.product import (
    AdminProductResponse,
    ProductImageDTO,
    ProductVariantDTO,
    PublicProductDetailResponse,
    PublicProductSummaryResponse,
)
from app.schemas.taxonomy import SubcategorySummaryDTO


def calculate_availability(product: Product) -> bool:
    """Calculate whether a garment is currently available for purchase/inquiry in showroom."""
    if product.manual_sold_out or product.is_damaged or product.is_retired:
        return False
    if not product.variants:
        return True  # If no variants defined, default available unless manual sold out
    return any(v.is_available for v in product.variants)


def should_show_price(
    product: Product,
    global_show_prices: bool = True,
) -> bool:
    """
    Calculate price visibility following three-tier precedence:
    1. Global OFF -> All customer prices hidden
    2. Category OFF -> Prices in that category hidden
    3. Product OFF -> That product price hidden
    """
    if not global_show_prices:
        return False
    if product.category and not product.category.show_prices:
        return False
    if not product.show_price:
        return False
    return True


def map_to_public_summary(
    product: Product,
    global_show_prices: bool = True,
    global_show_style_codes: bool = True,
) -> PublicProductSummaryResponse:
    """Map a Product model to the customer-facing summary card DTO."""
    primary_img = next((img.url for img in product.images if img.is_primary), None)
    if not primary_img and product.images:
        primary_img = product.images[0].url

    available_sizes = sorted(
        {v.size.name for v in product.variants if v.is_available and v.size is not None}
    )
    available_colors = sorted(
        {v.color.name for v in product.variants if v.is_available and v.color is not None}
    )

    visible_price = product.price if should_show_price(product, global_show_prices) else None
    visible_style_code = product.style_code if global_show_style_codes else None

    return PublicProductSummaryResponse(
        id=product.id,
        name=product.name,
        slug=product.slug,
        material=product.material,
        style_code=visible_style_code,
        featured=product.featured,
        is_available=calculate_availability(product),
        primary_image_url=primary_img,
        category_name=product.category.name if product.category else None,
        category_slug=product.category.slug if product.category else None,
        subcategory_name=product.subcategory.name if product.subcategory else None,
        subcategory_slug=product.subcategory.slug if product.subcategory else None,
        available_sizes=available_sizes,
        available_colors=available_colors,
        price=visible_price,
    )


def map_to_public_detail(
    product: Product,
    global_show_prices: bool = True,
    global_show_style_codes: bool = True,
) -> PublicProductDetailResponse:
    """Map a Product model to the full customer product detail view DTO."""
    visible_price = product.price if should_show_price(product, global_show_prices) else None
    visible_style_code = product.style_code if global_show_style_codes else None
    return PublicProductDetailResponse(
        id=product.id,
        name=product.name,
        slug=product.slug,
        description=product.description,
        material=product.material,
        style_code=visible_style_code,
        featured=product.featured,
        is_available=calculate_availability(product),
        meta_title=product.meta_title,
        meta_description=product.meta_description,
        category_name=product.category.name if product.category else None,
        category_slug=product.category.slug if product.category else None,
        subcategory_name=product.subcategory.name if product.subcategory else None,
        subcategory_slug=product.subcategory.slug if product.subcategory else None,
        price=visible_price,
        images=[
            ProductImageDTO(
                id=img.id,
                product_id=img.product_id,
                url=img.url,
                alt_text=img.alt_text,
                is_primary=img.is_primary,
                display_order=img.display_order,
                created_at=img.created_at,
            )
            for img in product.images
        ],
        variants=[
            ProductVariantDTO(
                id=v.id,
                product_id=v.product_id,
                size_id=v.size_id,
                color_id=v.color_id,
                sku=v.sku,
                is_available=v.is_available,
                created_at=v.created_at,
                updated_at=v.updated_at,
                size=SizeOptionDTO(
                    id=v.size.id, name=v.size.name, display_order=v.size.display_order
                )
                if v.size
                else None,
                color=ColorOptionDTO(
                    id=v.color.id,
                    name=v.color.name,
                    hex_code=v.color.hex_code,
                    display_order=v.color.display_order,
                )
                if v.color
                else None,
            )
            for v in product.variants
        ],
    )


def map_to_admin_response(product: Product) -> AdminProductResponse:
    """Map a Product model to the comprehensive admin response DTO."""
    return AdminProductResponse(
        id=product.id,
        category_id=product.category_id,
        subcategory_id=product.subcategory_id,
        name=product.name,
        slug=product.slug,
        description=product.description,
        material=product.material,
        style_code=product.style_code,
        qr_code=product.qr_code,
        qr_status=product.qr_status,
        operational_status=product.operational_status,
        is_damaged=product.is_damaged,
        is_retired=product.is_retired,
        sold_out_at=product.sold_out_at,
        damaged_at=product.damaged_at,
        retired_at=product.retired_at,
        lifecycle_state=product.lifecycle_state,
        manual_sold_out=product.manual_sold_out,
        featured=product.featured,
        price=product.price,
        show_price=product.show_price,
        meta_title=product.meta_title,
        meta_description=product.meta_description,
        created_at=product.created_at,
        updated_at=product.updated_at,
        is_available=calculate_availability(product),
        subcategory=SubcategorySummaryDTO(
            id=product.subcategory.id,
            category_id=product.subcategory.category_id,
            name=product.subcategory.name,
            slug=product.subcategory.slug,
            display_order=product.subcategory.display_order,
            is_active=product.subcategory.is_active,
        )
        if product.subcategory
        else None,
        images=[
            ProductImageDTO(
                id=img.id,
                product_id=img.product_id,
                url=img.url,
                alt_text=img.alt_text,
                is_primary=img.is_primary,
                display_order=img.display_order,
                created_at=img.created_at,
            )
            for img in product.images
        ],
        variants=[
            ProductVariantDTO(
                id=v.id,
                product_id=v.product_id,
                size_id=v.size_id,
                color_id=v.color_id,
                sku=v.sku,
                is_available=v.is_available,
                created_at=v.created_at,
                updated_at=v.updated_at,
                size=SizeOptionDTO(
                    id=v.size.id, name=v.size.name, display_order=v.size.display_order
                )
                if v.size
                else None,
                color=ColorOptionDTO(
                    id=v.color.id,
                    name=v.color.name,
                    hex_code=v.color.hex_code,
                    display_order=v.color.display_order,
                )
                if v.color
                else None,
            )
            for v in product.variants
        ],
    )
