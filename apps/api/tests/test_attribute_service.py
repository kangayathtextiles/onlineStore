import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateResourceException, EntityNotFoundException
from app.db.seed import seed_master_data
from app.schemas.attribute import (
    ColorOptionCreate,
    ColorOptionUpdate,
    SizeOptionCreate,
    SizeOptionUpdate,
)
from app.services.attribute_service import AttributeService


@pytest.mark.asyncio
async def test_attribute_service_sizes_crud(db_session: AsyncSession) -> None:
    """Test AttributeService methods for SizeOption."""
    service = AttributeService(db_session)

    # 1. Create
    created = await service.create_size(SizeOptionCreate(name="CustomXXL", display_order=99))
    assert created.id is not None
    assert created.name == "CustomXXL"
    assert created.display_order == 99

    # 2. Duplicate rejection
    with pytest.raises(DuplicateResourceException):
        await service.create_size(SizeOptionCreate(name="CustomXXL", display_order=100))

    # 3. Retrieve
    retrieved = await service.get_size_by_id(created.id)
    assert retrieved.id == created.id
    assert retrieved.name == "CustomXXL"

    # 4. Update
    updated = await service.update_size(
        created.id, SizeOptionUpdate(name="CustomXXL-Renamed", display_order=101)
    )
    assert updated.name == "CustomXXL-Renamed"
    assert updated.display_order == 101

    # 5. List
    all_sizes = await service.list_sizes()
    assert any(s.name == "CustomXXL-Renamed" for s in all_sizes)

    # 6. Delete
    await service.delete_size(created.id)

    # 7. Not found
    with pytest.raises(EntityNotFoundException):
        await service.get_size_by_id(created.id)


@pytest.mark.asyncio
async def test_attribute_service_colors_crud(db_session: AsyncSession) -> None:
    """Test AttributeService methods for ColorOption."""
    service = AttributeService(db_session)

    # 1. Create
    created = await service.create_color(
        ColorOptionCreate(name="Emerald Teal", hex_code="#008080", display_order=50)
    )
    assert created.id is not None
    assert created.name == "Emerald Teal"
    assert created.hex_code == "#008080"

    # 2. Duplicate rejection
    with pytest.raises(DuplicateResourceException):
        await service.create_color(
            ColorOptionCreate(name="Emerald Teal", hex_code="#009999", display_order=51)
        )

    # 3. Retrieve
    retrieved = await service.get_color_by_id(created.id)
    assert retrieved.id == created.id
    assert retrieved.name == "Emerald Teal"

    # 4. Update
    updated = await service.update_color(
        created.id, ColorOptionUpdate(name="Teal Green", hex_code="#007A7A")
    )
    assert updated.name == "Teal Green"
    assert updated.hex_code == "#007A7A"

    # 5. List
    all_colors = await service.list_colors()
    assert any(c.name == "Teal Green" for c in all_colors)

    # 6. Delete
    await service.delete_color(created.id)

    # 7. Not found
    with pytest.raises(EntityNotFoundException):
        await service.get_color_by_id(created.id)


@pytest.mark.asyncio
async def test_admin_and_public_attribute_endpoints(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Test Admin and Public HTTP routes using AttributeService."""
    await seed_master_data(db_session)

    # Public sizes & colors
    pub_sizes = await client.get("/api/v1/public/attributes/sizes")
    assert pub_sizes.status_code == 200
    assert len(pub_sizes.json()) >= 16

    pub_colors = await client.get("/api/v1/public/attributes/colors")
    assert pub_colors.status_code == 200
    assert len(pub_colors.json()) >= 10

    # Admin create size
    new_size_resp = await client.post(
        "/api/v1/admin/attributes/sizes",
        json={"name": "50", "display_order": 99},
    )
    assert new_size_resp.status_code == 201
    size_id = new_size_resp.json()["id"]

    # Admin update size
    up_size_resp = await client.put(
        f"/api/v1/admin/attributes/sizes/{size_id}",
        json={"name": "52"},
    )
    assert up_size_resp.status_code == 200
    assert up_size_resp.json()["name"] == "52"

    # Admin delete size
    del_size_resp = await client.delete(f"/api/v1/admin/attributes/sizes/{size_id}")
    assert del_size_resp.status_code == 200

    # Admin create color
    new_color_resp = await client.post(
        "/api/v1/admin/attributes/colors",
        json={"name": "Sky Blue", "hex_code": "#87CEEB", "display_order": 99},
    )
    assert new_color_resp.status_code == 201
    color_id = new_color_resp.json()["id"]

    # Admin update color
    up_color_resp = await client.put(
        f"/api/v1/admin/attributes/colors/{color_id}",
        json={"hex_code": "#00BFFF"},
    )
    assert up_color_resp.status_code == 200
    assert up_color_resp.json()["hex_code"] == "#00BFFF"

    # Admin delete color
    del_color_resp = await client.delete(f"/api/v1/admin/attributes/colors/{color_id}")
    assert del_color_resp.status_code == 200
