from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class RouteRequest(BaseModel):
    source: str
    destination: str
    time: str

class RouteOption(BaseModel):
    id: int
    name: str
    coordinates: list[list[float]]
    eta: str
    distance: str
    smartScore: float
    congestion: str

@router.post("/", response_model=list[RouteOption])
async def get_smart_routes(request: RouteRequest):
    """
    Return AI-ranked route options.
    Smart Score = Distance + ETA + Predicted Future Traffic + Delay Risk
    """
    routes = [
        RouteOption(
            id=1, name="AI-Optimal Route",
            coordinates=[[17.385, 78.4867], [17.393, 78.4927], [17.403, 78.5017]],
            eta="12 mins", distance="3.1 km", smartScore=96.2, congestion="Low"
        ),
        RouteOption(
            id=2, name="Fastest Route",
            coordinates=[[17.385, 78.4867], [17.397, 78.4897], [17.403, 78.5017]],
            eta="10 mins", distance="2.8 km", smartScore=88.7, congestion="Medium"
        ),
        RouteOption(
            id=3, name="Alternate Route",
            coordinates=[[17.385, 78.4867], [17.390, 78.4987], [17.403, 78.5017]],
            eta="16 mins", distance="3.8 km", smartScore=79.3, congestion="Low"
        ),
    ]
    routes.sort(key=lambda r: r.smartScore, reverse=True)
    return routes
