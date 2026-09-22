import asyncio
import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

PING_PATH = "/api/v1/ping"


# Render free tier spins the service down after ~15 min without inbound traffic.
# This loop hits our own public URL (it must go through Render's proxy, localhost
# doesn't count) every KEEP_ALIVE_INTERVAL_SECONDS so the service never goes idle.
async def _keep_alive_loop(url: str, interval: int) -> None:
    async with httpx.AsyncClient(timeout=10.0) as client:
        while True:
            await asyncio.sleep(interval)
            try:
                response = await client.get(url)
                logger.info("Keep-alive ping %s -> %s", url, response.status_code)
            except httpx.HTTPError as e:
                logger.warning("Keep-alive ping %s failed: %s", url, e)


def start_keep_alive() -> asyncio.Task | None:
    """Starts the self-ping task. Returns None (disabled) when no public URL is
    configured, e.g. in local dev where RENDER_EXTERNAL_URL isn't set."""
    if not settings.RENDER_EXTERNAL_URL or settings.KEEP_ALIVE_INTERVAL_SECONDS <= 0:
        logger.info("Keep-alive scheduler disabled")
        return None

    url = settings.RENDER_EXTERNAL_URL.rstrip("/") + PING_PATH
    logger.info(
        "Keep-alive scheduler started: pinging %s every %ss",
        url,
        settings.KEEP_ALIVE_INTERVAL_SECONDS,
    )
    return asyncio.create_task(
        _keep_alive_loop(url, settings.KEEP_ALIVE_INTERVAL_SECONDS)
    )
