import os
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
import database
from database import Base
from sajag_router import router as sajag_router

app = FastAPI(
    title="SAJAG - Personnel Stress and Welfare Monitoring System (SIH26186)",
    description="Ministry of Home Affairs / CAPF / Police Early-Warning Wellbeing Intelligence Backend",
    version="2.0.0"
)

@app.on_event("startup")
def init_database():
    """Initialize ORM database tables upon application startup."""
    Base.metadata.create_all(bind=database.engine)

# Mount SAJAG Core Router
app.include_router(sajag_router)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    """Backend system health check."""
    return {
        "status": "healthy",
        "system": "SAJAG Personnel Stress and Welfare Monitoring System",
        "version": "2.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }
