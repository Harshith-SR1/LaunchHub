from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.blueprint_service import blueprint_service

router = APIRouter(prefix="/blueprint", tags=["Startup Blueprint Engine"])

class BlueprintQuery(BaseModel):
    idea: str

@router.post("/generate")
def generate_blueprint(body: BlueprintQuery):
    if not body.idea.strip():
        raise HTTPException(status_code=400, detail="Idea description cannot be empty")
    return blueprint_service.generate(body.idea)
