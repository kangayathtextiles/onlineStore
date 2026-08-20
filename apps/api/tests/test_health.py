import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_root_health(client: AsyncClient) -> None:
    """Test operational root health check endpoint."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert data["app"] == "Kangayath Web API"


@pytest.mark.asyncio
async def test_api_v1_health(client: AsyncClient) -> None:
    """Test detailed v1 health and subsystem metadata check."""
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "environment" in data
    assert "version" in data
    assert "timestamp" in data
    assert isinstance(data["subsystems"], list)
    assert len(data["subsystems"]) >= 2
