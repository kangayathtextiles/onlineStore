import pytest

from app.db.session import get_async_session


@pytest.mark.asyncio
async def test_get_async_session_lifecycle() -> None:
    """Verify that get_async_session yields an active session and closes cleanly."""
    session_gen = get_async_session()
    session = await anext(session_gen)
    assert session is not None
    assert session.is_active

    # Complete the generator
    with pytest.raises(StopAsyncIteration):
        await anext(session_gen)
