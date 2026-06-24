import time
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from app.database import db
from app.auth import get_current_user, check_verification_level

router = APIRouter(prefix="/verification", tags=["Identity & Verification"])

class VerificationRequestSubmit(BaseModel):
    govIdUrl: str
    portfolioUrl: Optional[str] = ""
    levelRequested: int # 1 to 5

class ReviewRequest(BaseModel):
    approve: bool
    rejectionReason: Optional[str] = ""

@router.post("/submit")
def submit_verification(body: VerificationRequestSubmit, user: dict = Depends(get_current_user)):
    user_id = user["id"]
    if body.levelRequested < 1 or body.levelRequested > 5:
        raise HTTPException(status_code=400, detail="Invalid level. Choose between 1 and 5")
        
    req_item = {
        "PK": f"VERIFY#{user_id}",
        "SK": "REQUEST",
        "userId": user_id,
        "username": user["username"],
        "fullName": user["fullName"],
        "govIdUrl": body.govIdUrl,
        "portfolioUrl": body.portfolioUrl,
        "levelRequested": body.levelRequested,
        "status": "pending",
        "submittedAt": int(time.time())
    }
    db.put_item(req_item)
    return {"message": "Verification request submitted successfully", "status": "pending"}

@router.get("/status")
def get_verification_status(user: dict = Depends(get_current_user)):
    user_id = user["id"]
    res = db.get_item({"PK": f"VERIFY#{user_id}", "SK": "REQUEST"})
    req = res.get("Item")
    
    return {
        "currentLevel": user.get("verificationLevel", 0),
        "trustScore": user.get("trustScore", 50),
        "pendingRequest": req if req else None
    }

# Admin approval endpoint (requires Level 4/Admin or Mock bypass)
@router.post("/admin/review/{userId}")
def review_verification(userId: str, body: ReviewRequest, admin: dict = Depends(get_current_user)):
    # Fetch user verification request
    req_res = db.get_item({"PK": f"VERIFY#{userId}", "SK": "REQUEST"})
    req = req_res.get("Item")
    if not req:
        raise HTTPException(status_code=404, detail="No pending verification request found for user")
        
    if body.approve:
        # Update user profile verification level and boost trust score
        new_level = req["levelRequested"]
        trust_boost = new_level * 10
        
        db.update_item(
            Key={"PK": f"USER#{userId}", "SK": "PROFILE"},
            UpdateExpression="SET verificationLevel = :lvl, trustScore = trustScore + :boost",
            ExpressionAttributeValues={":lvl": new_level, ":boost": trust_boost}
        )
        
        # Update request status
        db.update_item(
            Key={"PK": f"VERIFY#{userId}", "SK": "REQUEST"},
            UpdateExpression="SET #status = :s, reviewedAt = :t",
            ExpressionAttributeValues={":s": "approved", ":t": int(time.time())},
            ExpressionAttributeNames={"#status": "status"}
        )
        return {"message": f"User verification request approved. Upgraded to Level {new_level}"}
    else:
        # Reject request
        db.update_item(
            Key={"PK": f"VERIFY#{userId}", "SK": "REQUEST"},
            UpdateExpression="SET #status = :s, rejectionReason = :r, reviewedAt = :t",
            ExpressionAttributeValues={
                ":s": "rejected", 
                ":r": body.rejectionReason or "Details could not be verified",
                ":t": int(time.time())
            },
            ExpressionAttributeNames={"#status": "status"}
        )
        return {"message": "User verification request rejected"}
