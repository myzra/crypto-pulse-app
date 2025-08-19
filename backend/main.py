# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from app.routers import auth, users, coins, favorites, notifications
from app.database import init_db
from app.services import price_service

from app.scheduler.price_scheduler import start_background_tasks, stop_background_tasks

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up...")
    await init_db()
    yield
    print("Shutting down...")

app = FastAPI(
    title="Crypto Pulse API",
    description="Backend API for Crypto Pulse mobile app",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(price_service.router, prefix="/api/admin", tags=["Admin"])
app.include_router(coins.router, prefix="/api/coins", tags=["Coins"])
app.include_router(favorites.router, prefix="/api/favorites", tags=["Favorites"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])


@app.on_event("startup")
async def startup_event():
    """Start background tasks when the app starts"""
    print("Starting Crypto Pulse API...")
    start_background_tasks()
    print("Price scheduler started")

# Shutdown event - stop the price scheduler
@app.on_event("shutdown")
async def shutdown_event():
    """Clean up background tasks when the app shuts down"""
    print("Shutting down Crypto Pulse API...")
    stop_background_tasks()
    print("Price scheduler stopped")
    
@app.get("/")
async def root():
    return {"message": "Crypto Pulse API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )