import redis
from app.core.config import settings

# 1. Create connection pool directly from the DSN string
pool = redis.ConnectionPool.from_url(
    str(settings.REDIS_URL),
    decode_responses=True,
    max_connections=20,
)

# 2. Shared Redis client instance
redis_client = redis.Redis(connection_pool=pool)