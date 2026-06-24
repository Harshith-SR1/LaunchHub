import time
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from app.database import db
from app.auth import get_current_user
from app.models.asset import (
    DomainCreate, DomainResponse,
    WebsiteCreate, WebsiteResponse,
    AppCreate, AppResponse,
    AIAssetCreate, AIAssetResponse
)

router = APIRouter(prefix="/marketplace", tags=["Marketplace Asset Exchange"])

# ==========================================
# MODULE 1: DOMAIN EXCHANGE
# ==========================================
@router.post("/domains", response_model=DomainResponse, status_code=status.HTTP_201_CREATED)
def create_domain(body: DomainCreate, user: dict = Depends(get_current_user)):
    asset_id = str(uuid.uuid4())
    item = {
        "PK": f"ASSET#DOMAIN#{asset_id}",
        "SK": "METADATA",
        "GSI1PK": "ASSETS#DOMAIN",
        "GSI1SK": f"PRICE#{body.price}",
        "id": asset_id,
        "name": body.name,
        "extension": body.extension,
        "category": body.category,
        "price": body.price,
        "leasePrice": body.leasePrice,
        "traffic": body.traffic,
        "age": body.age,
        "description": body.description,
        "sellerId": user["id"],
        "verificationStatus": "pending",
        "status": "active",
        "createdAt": int(time.time()),
        "valuationScore": body.valuationScore or 75.0,
        "fitScore": body.fitScore or 80.0,
        "demandScore": body.demandScore or 72.0,
        "industryFitAnalysis": body.industryFitAnalysis or f"Strong domain positioning for the {body.category} sector with high brand recall potential."
    }
    db.put_item(item)
    return item

@router.get("/domains", response_model=List[DomainResponse])
def list_domains(category: Optional[str] = None, extension: Optional[str] = None, maxPrice: Optional[float] = None):
    # Query domains
    res = db.query(
        KeyConditionExpression="GSI1PK = :pk",
        ExpressionAttributeValues={":pk": "ASSETS#DOMAIN"},
        IndexName="GSI1"
    )
    items = res.get("Items", [])
    
    # Filter
    filtered = []
    for item in items:
        if category and item.get("category") != category:
            continue
        if extension and item.get("extension") != extension:
            continue
        if maxPrice is not None and item.get("price", 0.0) > maxPrice:
            continue
        filtered.append(item)
    return filtered

# ==========================================
# MODULE 2: WEBSITE & SAAS EXCHANGE
# ==========================================
@router.post("/websites", response_model=WebsiteResponse, status_code=status.HTTP_201_CREATED)
def create_website(body: WebsiteCreate, user: dict = Depends(get_current_user)):
    asset_id = str(uuid.uuid4())
    item = {
        "PK": f"ASSET#WEBSITE#{asset_id}",
        "SK": "METADATA",
        "GSI1PK": "ASSETS#WEBSITE",
        "GSI1SK": f"REVENUE#{body.revenue}",
        "id": asset_id,
        "title": body.title,
        "category": body.category,
        "description": body.description,
        "revenue": body.revenue,
        "users": body.users,
        "mrr": body.mrr,
        "arr": body.arr,
        "traffic": body.traffic,
        "stack": body.stack,
        "demoUrl": body.demoUrl,
        "askingPrice": body.askingPrice,
        "price": body.askingPrice, # alias
        "sellerId": user["id"],
        "status": "active",
        "createdAt": int(time.time()),
        "healthScore": body.healthScore or 84.0,
        "riskScore": body.riskScore or 15.0,
        "growthPotentialScore": body.growthPotentialScore or 88.0,
        "growthTrend": body.growthTrend or "upward"
    }
    db.put_item(item)
    return item

@router.get("/websites", response_model=List[WebsiteResponse])
def list_websites(category: Optional[str] = None, maxPrice: Optional[float] = None):
    res = db.query(
        KeyConditionExpression="GSI1PK = :pk",
        ExpressionAttributeValues={":pk": "ASSETS#WEBSITE"},
        IndexName="GSI1"
    )
    items = res.get("Items", [])
    
    filtered = []
    for item in items:
        if category and item.get("category") != category:
            continue
        if maxPrice is not None and item.get("askingPrice", 0.0) > maxPrice:
            continue
        filtered.append(item)
    return filtered

# ==========================================
# MODULE 3: APP MARKETPLACE
# ==========================================
@router.post("/apps", response_model=AppResponse, status_code=status.HTTP_201_CREATED)
def create_app(body: AppCreate, user: dict = Depends(get_current_user)):
    asset_id = str(uuid.uuid4())
    item = {
        "PK": f"ASSET#APP#{asset_id}",
        "SK": "METADATA",
        "GSI1PK": "ASSETS#APP",
        "GSI1SK": f"DOWNLOADS#{body.downloads}",
        "id": asset_id,
        "title": body.title,
        "category": body.category,
        "description": body.description,
        "downloads": body.downloads,
        "revenue": body.revenue,
        "platform": body.platform,
        "price": body.price,
        "sellerId": user["id"],
        "status": "active",
        "createdAt": int(time.time())
    }
    db.put_item(item)
    return item

@router.get("/apps", response_model=List[AppResponse])
def list_apps(platform: Optional[str] = None, category: Optional[str] = None, maxPrice: Optional[float] = None):
    res = db.query(
        KeyConditionExpression="GSI1PK = :pk",
        ExpressionAttributeValues={":pk": "ASSETS#APP"},
        IndexName="GSI1"
    )
    items = res.get("Items", [])
    
    filtered = []
    for item in items:
        if platform and item.get("platform") != platform:
            continue
        if category and item.get("category") != category:
            continue
        if maxPrice is not None and item.get("price", 0.0) > maxPrice:
            continue
        filtered.append(item)
    return filtered

# ==========================================
# MODULE 4: AI ASSET MARKETPLACE
# ==========================================
@router.post("/ai", response_model=AIAssetResponse, status_code=status.HTTP_201_CREATED)
def create_ai_asset(body: AIAssetCreate, user: dict = Depends(get_current_user)):
    asset_id = str(uuid.uuid4())
    # SubCategory used as part of GSI1PK for partitioned AI search (datasets vs models vs agents)
    item = {
        "PK": f"ASSET#AI#{asset_id}",
        "SK": "METADATA",
        "GSI1PK": f"ASSETS#AI#{body.subCategory}",
        "GSI1SK": f"PRICE#{body.price}",
        "id": asset_id,
        "title": body.title,
        "description": body.description,
        "category": body.category,
        "subCategory": body.subCategory,
        "price": body.price,
        "accessType": body.accessType,
        "rentPrice": body.rentPrice,
        "sellerId": user["id"],
        "status": "active",
        "createdAt": int(time.time())
    }
    db.put_item(item)
    return item

@router.get("/ai", response_model=List[AIAssetResponse])
def list_ai_assets(subCategory: Optional[str] = None, category: Optional[str] = None):
    results = []
    # If subCategory is specified, we query GSI1 directly, else scan/compile
    subcategories = [subCategory] if subCategory else ["Datasets", "ML Models", "AI Agents", "Prompt Libraries", "Workflows", "Automation Templates"]
    
    for sub in subcategories:
        res = db.query(
            KeyConditionExpression="GSI1PK = :pk",
            ExpressionAttributeValues={":pk": f"ASSETS#AI#{sub}"},
            IndexName="GSI1"
        )
        results.extend(res.get("Items", []))
        
    filtered = []
    for item in results:
        if category and item.get("category") != category:
            continue
        filtered.append(item)
    return filtered
