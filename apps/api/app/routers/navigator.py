from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.navigator_service import navigator_service

router = APIRouter(prefix="/navigator", tags=["Venture Navigator (AI Discovery)"])

class NavigatorQuery(BaseModel):
    query: str

@router.post("/search")
def search_venture(body: NavigatorQuery):
    if not body.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    return navigator_service.navigate(body.query)
