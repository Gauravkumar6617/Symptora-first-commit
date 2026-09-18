from fastapi import FastAPI
from app.core.database import database_check
from app.core.config import settings
from app.core.redis import redis_health_check
from app.routers.userRouter import router as UserRouter
app = FastAPI(
    title=settings.APP_NAME,
    version=str(settings.VERSION)
) #making object of fastapi and tranfering to app



app.include_router(UserRouter, prefix="/api/v1")

# Health api for project ---current(server)
@app.get("/api/v1/health")
def health_check():
    database_status = database_check()
    redis_status = redis_health_check()
 

    return {
        "status": "System Operational",
        "database": "connected" if database_status else "disconnected",
        "redis":"connected" if redis_status else "disonntected"
        
    }