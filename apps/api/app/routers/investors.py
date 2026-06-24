import time
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from app.database import db
from app.auth import get_current_user
from app.models.investor import InvestorProfileCreate, InvestorProfileResponse, ExpressInterestRequest

router = APIRouter(prefix="/investors", tags=["Investor Network"])

@router.post("", response_model=InvestorProfileResponse)
def create_investor_profile(body: InvestorProfileCreate, user: dict = Depends(get_current_user)):
    # Verify they have role investor (we can also auto-assign or enforce verification)
    item = {
        "PK": f"INVESTOR#{user['id']}",
        "SK": "METADATA",
        "GSI1PK": "INVESTORS",
        "GSI1SK": f"NAME#{body.name}",
        "userId": user["id"],
        "name": body.name,
        "organization": body.organization,
        "industryFocus": body.industryFocus,
        "ticketSize": body.ticketSize,
        "stagePreference": body.stagePreference,
        "createdAt": int(time.time())
    }
    db.put_item(item)
    
    # Also update user role to investor in profile database
    db.update_item(
        Key={"PK": user["PK"], "SK": user["SK"]},
        UpdateExpression="SET #role = :r",
        ExpressionAttributeValues={":r": "investor"},
        ExpressionAttributeNames={"#role": "role"}
    )
    
    return item

@router.get("", response_model=List[dict])
def list_investors():
    res = db.query(
        KeyConditionExpression="GSI1PK = :pk",
        ExpressionAttributeValues={":pk": "INVESTORS"},
        IndexName="GSI1"
    )
    return res.get("Items", [])

@router.post("/interest")
def express_interest(body: ExpressInterestRequest, user: dict = Depends(get_current_user)):
    # Verify startup exists
    startup_res = db.get_item({"PK": f"STARTUP#{body.startupId}", "SK": "METADATA"})
    startup = startup_res.get("Item")
    if not startup:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Startup listing not found"
        )
        
    interest_id = str(uuid.uuid4())
    interest_item = {
        "PK": f"STARTUP#{body.startupId}#INTEREST",
        "SK": f"INT#{interest_id}",
        "id": interest_id,
        "startupId": body.startupId,
        "startupName": startup["name"],
        "investorId": user["id"],
        "investorName": user["fullName"],
        "investorOrg": user.get("companyName", "Independent Angel"),
        "message": body.message,
        "proposedTerms": body.proposedTerms,
        "status": "pending",
        "createdAt": int(time.time())
    }
    db.put_item(interest_item)
    return {"message": "Investment interest expressed successfully", "interestId": interest_id}
