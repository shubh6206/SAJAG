import os
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import database
from database import Base

app = FastAPI(
    title="SAJAG - Personnel Stress and Welfare Monitoring System (SIH26186)",
    description="Ministry of Home Affairs / CAPF / Police Early-Warning Wellbeing Intelligence Backend",
    version="2.0.0"
)

@app.on_event("startup")
def init_database():
    """Initialize ORM database tables upon application startup."""
    Base.metadata.create_all(bind=database.engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "system": "SAJAG Personnel Stress and Welfare Monitoring System",
        "version": "2.0.0"
    }
