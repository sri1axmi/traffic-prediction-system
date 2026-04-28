from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

feedback_log = []

class FeedbackRequest(BaseModel):
    route_id: int
    source: str
    destination: str
    predicted_congestion: str
    actual_congestion: str
    predicted_delay_mins: int
    actual_delay_mins: int
    rating: int

@router.post("/")
async def submit_feedback(req: FeedbackRequest):
    entry = req.dict()
    entry["timestamp"] = datetime.utcnow().isoformat()
    feedback_log.append(entry)
    return {
        "status": "ok",
        "message": "Feedback recorded. Thank you for improving our model!",
        "total_feedback": len(feedback_log)
    }

@router.get("/stats")
async def feedback_stats():
    if not feedback_log:
        return {"message": "No feedback yet"}
    total = len(feedback_log)
    correct = sum(1 for f in feedback_log if f["predicted_congestion"] == f["actual_congestion"])
    accuracy = round((correct / total) * 100, 2)
    avg_rating = round(sum(f["rating"] for f in feedback_log) / total, 2)
    return {
        "total_predictions": total,
        "congestion_accuracy_pct": accuracy,
        "average_rating": avg_rating,
    }
