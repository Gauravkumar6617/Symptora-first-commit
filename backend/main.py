from fastapi import FastAPI
from app.core.database import database_check
from app.core.config import settings
from app.core.redis import redis_health_check
from app.routers.userRouter import router as UserRouter
from app.routers.doctorRouter import router as DoctorRouter
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI(
    title=settings.APP_NAME,
    version=str(settings.VERSION)
) #making object of fastapi and tranfering to app

origins = [
    "http://localhost:3000",   # your frontend dev URL
    "http://localhost:5173",   # e.g. Vite default
    "https://yourdomain.com",  # production frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],   # or restrict: ["GET", "POST", "PUT", "DELETE"]
    allow_headers=["*"],   # or restrict: ["Authorization", "Content-Type"]
)

app.include_router(UserRouter, prefix="/api/v1")
app.include_router(DoctorRouter,prefix="/api/v1")




@app.get("/")
def intialPage():
    return {
        "message":"Welcome to Symptora"
    }
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