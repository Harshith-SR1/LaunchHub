import time
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from app.database import db
from app.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/talent", tags=["Talent Marketplace"])

class TalentProfileCreate(BaseModel):
    role: str # Developer, Designer, AI Engineer, ML Engineer, Marketer, PM, Agency
    skills: List[str]
    ratePerHour: float
    availability: str # e.g. "20 hrs/week", "Full-time"
    portfolio: List[str]

class TalentProfileResponse(BaseModel):
    userId: str
    fullName: str
    role: str
    skills: List[str]
    ratePerHour: float
    availability: str
    portfolio: List[str]
    rating: float
    reviewsCount: int
    trustScore: int
    createdAt: int

class HireRequest(BaseModel):
    message: str
    budget: float
    estimatedHours: int

@router.post("", response_model=TalentProfileResponse)
def register_talent(body: TalentProfileCreate, user: dict = Depends(get_current_user)):
    item = {
        "PK": f"TALENT#{user['id']}",
        "SK": "METADATA",
        "GSI1PK": f"TALENT#ROLE#{body.role}",
        "GSI1SK": f"RATE#{body.ratePerHour}",
        "userId": user["id"],
        "fullName": user["fullName"],
        "role": body.role,
        "skills": body.skills,
        "ratePerHour": body.ratePerHour,
        "availability": body.availability,
        "portfolio": body.portfolio,
        "rating": 5.0, # default starting rating
        "reviewsCount": 0,
        "trustScore": user.get("trustScore", 50),
        "createdAt": int(time.time())
    }
    db.put_item(item)
    
    # Also update user profile role in main user object
    db.update_item(
        Key={"PK": user["PK"], "SK": user["SK"]},
        UpdateExpression="SET #role = :r, #sk = :sk, #port = :port",
        ExpressionAttributeValues={":r": body.role, ":sk": body.skills, ":port": body.portfolio},
        ExpressionAttributeNames={"#role": "role", "#sk": "skills", "#port": "portfolio"}
    )
    
    return item

@router.get("", response_model=List[TalentProfileResponse])
def list_talent(role: Optional[str] = None):
    results = []
    roles = [role] if role else ["Developer", "Designer", "AI Engineer", "ML Engineer", "Marketer", "Product Manager", "Agency"]
    
    for r in roles:
        res = db.query(
            KeyConditionExpression="GSI1PK = :pk",
            ExpressionAttributeValues={":pk": f"TALENT#ROLE#{r}"},
            IndexName="GSI1"
        )
        results.extend(res.get("Items", []))
    return results

@router.post("/{userId}/hire")
def submit_hire_request(userId: str, body: HireRequest, user: dict = Depends(get_current_user)):
    # Verify talent profile exists
    res = db.get_item({"PK": f"TALENT#{userId}", "SK": "METADATA"})
    if not res.get("Item"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Talent profile not found"
        )
        
    hire_id = str(uuid.uuid4())
    hire_item = {
        "PK": f"USER#{userId}#HIRE",
        "SK": f"REQ#{hire_id}",
        "id": hire_id,
        "clientId": user["id"],
        "clientName": user["fullName"],
        "talentId": userId,
        "message": body.message,
        "budget": body.budget,
        "estimatedHours": body.estimatedHours,
        "status": "pending",
        "createdAt": int(time.time())
    }
    db.put_item(hire_item)
    return {"message": "Hiring request submitted successfully", "id": hire_id}
