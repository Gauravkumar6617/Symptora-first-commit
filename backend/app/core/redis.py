import redis
from app.core.config import settings

redis_client = redis.from_url(str(settings.REDIS_URL),decode_responses=True)
# decode_responses= Redis bytes → Python strings

#test function
def redis_check()-> bool:
    try:
        return redis_client.ping()
    except Exception:
        return False