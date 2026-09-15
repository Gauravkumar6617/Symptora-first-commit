from fastapi import FastAPI
from app.core.database import database_check
from app.core.redis import redis_check
app = FastAPI() #making object of fastapi and tranfering to app


# Health api for project ---current(server)
@app.get("/api/v1/health")
def health_check():
    database_status = database_check()
    redis_status = redis_check()

    return {
        "status": "System Operational",
        "database": "connected" if database_status else "disconnected",
        "redis": "connected" if redis_status else "disconnected",
    }