from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from api.auth import router as auth_router
from api.predict import router as predict_router
from api.route import router as route_router
from api.feedback import router as feedback_router

app = FastAPI(title="AntiGravity Traffic Intelligence API", version="4.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus metrics (auto-instruments all endpoints)
Instrumentator().instrument(app).expose(app, endpoint="/metrics")

app.include_router(auth_router,     prefix="/api/auth",     tags=["Auth"])
app.include_router(predict_router,  prefix="/api/predict",  tags=["Prediction"])
app.include_router(route_router,    prefix="/api/route",    tags=["Routing"])
app.include_router(feedback_router, prefix="/api/feedback", tags=["Feedback"])

from api.ws import router as ws_router
app.include_router(ws_router, prefix="/api/ws", tags=["WebSockets"])

import asyncio
from services.traffic_ingestor import traffic_ingestion_loop

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(traffic_ingestion_loop())

@app.get("/", tags=["Health"])
async def root():
    return {"message": "AntiGravity Traffic Intelligence API v4", "status": "ok"}

@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy", "version": "4.0.0"}
