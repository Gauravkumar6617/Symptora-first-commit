import asyncio
from contextlib import asynccontextmanager, suppress
from fastapi import FastAPI
from app.core.database import database_check
from app.core.config import settings
from app.core.redis import redis_health_check
from app.core.keep_alive import start_keep_alive
from app.routers.userRouter import router as UserRouter
from app.routers.doctorRouter import router as DoctorRouter
from app.routers.clinicRouter import router as ClinicRouter
from app.routers.adminRouter import router as AdminRouter
from app.routers.familyMemberRouter import router as FamilyMemberRouter
from app.routers.predictionRouter import router as PredictionRouter
from app.routers.blogRouter import router as BlogRouter, admin_router as AdminBlogRouter
from app.services.predictionService import get_prediction_service
from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    # start keep-alive scheduler on boot, stop it cleanly on shutdown
    keep_alive_task = start_keep_alive()
    # load the symptom model once at boot so the first /predict isn't slow
    with suppress(FileNotFoundError):
        get_prediction_service()
    yield
    if keep_alive_task:
        keep_alive_task.cancel()
        with suppress(asyncio.CancelledError):
            await keep_alive_task


app = FastAPI(
    title=settings.APP_NAME,
    version=str(settings.VERSION),
    lifespan=lifespan,
) #making object of fastapi and tranfering to app

origins = [
    "http://localhost:3000",   # your frontend dev URL
    "http://localhost:5173",   # e.g. Vite default
    "https://symptora-ten.vercel.app",  # production frontend
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
app.include_router(ClinicRouter,prefix="/api/v1")
app.include_router(AdminRouter,prefix="/api/v1")
app.include_router(FamilyMemberRouter,prefix="/api/v1")
app.include_router(PredictionRouter,prefix="/api/v1")
app.include_router(BlogRouter,prefix="/api/v1")
app.include_router(AdminBlogRouter,prefix="/api/v1")




@app.get("/")
def intialPage():
    return {
        "message":"Welcome to Symptora"
    }
# Lightweight liveness api (no DB/Redis calls) --- used by keep-alive scheduler / uptime monitors
@app.api_route("/api/v1/ping", methods=["GET", "HEAD"])
def ping():
    return {"status": "ok"}

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
