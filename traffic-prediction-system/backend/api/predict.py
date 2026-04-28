from fastapi import APIRouter
from pydantic import BaseModel
from ml.model_manager import predict_congestion

router = APIRouter()

class PredictRequest(BaseModel):
    city: str
    area: str
    road: str
    time: str

class SegmentPrediction(BaseModel):
    location: list[float]
    congestionLevel: str

class FeatureImpact(BaseModel):
    name: str
    impact: float

class PredictResponse(BaseModel):
    overallCongestion: str
    delay: int
    confidence: float
    predictionWindow: str
    segments: list[SegmentPrediction]
    features: list[FeatureImpact]

@router.post("/", response_model=PredictResponse)
async def predict_future_traffic(request: PredictRequest):
    result = predict_congestion(request.city, request.area, request.road, request.time)
    return result
