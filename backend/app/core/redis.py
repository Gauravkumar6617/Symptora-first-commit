import redis
from app.core.config import settings

# Connection pool with explicit socket timeouts to prevent hanging
pool = redis.ConnectionPool.from_url(
    str(settings.REDIS_URL),
    decode_responses=True,
    max_connections=20,
    socket_timeout=2.0,      # Timeout for read/write operations
    socket_connect_timeout=2.0, # Timeout for establishing connection
)

# Shared Redis client instance
redis_client = redis.Redis(connection_pool=pool)


def redis_health_check() -> bool:
    """Pings Redis to check connectivity. Returns True if healthy, raises ValueError on failure."""
    try:
        is_alive = redis_client.ping()
        if not is_alive:
            raise ValueError("Redis ping returned False")
        return True
    except (redis.RedisError, Exception) as e:
        raise ValueError(f"Redis health check failed: {e}") from e