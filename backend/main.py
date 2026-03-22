from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import init_db
from backend.routers import control, export, sessions, telemetry


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Everything before `yield` runs at startup.
    # Everything after `yield` runs at shutdown.
    init_db()
    yield


app = FastAPI(title="Proto-AUV Dashboard", version="0.1.0", lifespan=lifespan)

# Allow the Vite dev server to call the API without browser CORS errors.
# In production this should be replaced with the actual deployed frontend URL.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers own their route functions. main.py just mounts them at a prefix.
# The tag groups them visually in Swagger UI.
app.include_router(telemetry.router, prefix="/telemetry", tags=["Telemetry"])
app.include_router(sessions.router, prefix="/sessions", tags=["Sessions"])
app.include_router(export.router, prefix="/sessions", tags=["Sessions"])
app.include_router(control.router, prefix="/control", tags=["Control"])


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "message": "Proto-AUV backend running"}
