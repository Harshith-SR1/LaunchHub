import time
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from app.database import db
from app.auth import get_current_user
from app.models.startup import (
    StartupHubCreate, StartupHubResponse,
    ApplyJoinRequest, CoFounderProfileCreate, CoFounderProfileResponse
)

router = APIRouter(tags=["Startup Hub & Co-Founder Matching"])

# ==========================================
# MODULE 6: STARTUP HUB (IDEA BOARD)
# ==========================================
@router.post("/startups", response_model=StartupHubResponse, status_code=status.HTTP_201_CREATED)
def create_startup(body: StartupHubCreate, user: dict = Depends(get_current_user)):
    startup_id = str(uuid.uuid4())
    item = {
        "PK": f"STARTUP#{startup_id}",
        "SK": "METADATA",
        "GSI1PK": f"STARTUPS#STAGE#{body.stage}",
        "GSI1SK": f"CREATED#{int(time.time())}",
        "id": startup_id,
        "name": body.name,
        "problem": body.problem,
        "solution": body.solution,
        "market": body.market,
        "vision": body.vision,
        "fundingNeeded": body.fundingNeeded,
        "teamRequirements": body.teamRequirements,
        "stage": body.stage,
        "founderId": user["id"],
        "likes": 0,
        "saves": 0,
        "follows": 0,
        "createdAt": int(time.time())
    }
    db.put_item(item)
    return item

@router.get("/startups", response_model=List[StartupHubResponse])
def list_startups(stage: Optional[str] = None):
    results = []
    stages = [stage] if stage else ["Idea", "MVP", "Early Revenue", "Growth"]
    
    for stg in stages:
        res = db.query(
            KeyConditionExpression="GSI1PK = :pk",
            ExpressionAttributeValues={":pk": f"STARTUPS#STAGE#{stg}"},
            IndexName="GSI1"
        )
        results.extend(res.get("Items", []))
    return results

@router.post("/startups/{id}/interact")
def interact_startup(id: str, action: str, user: dict = Depends(get_current_user)):
    # Actions: like, save, follow
    if action not in ["like", "save", "follow"]:
        raise HTTPException(status_code=400, detail="Invalid action. Choose like, save, or follow")
        
    res = db.get_item({"PK": f"STARTUP#{id}", "SK": "METADATA"})
    startup = res.get("Item")
    if not startup:
        raise HTTPException(status_code=404, detail="Startup listing not found")
        
    # Increment count
    count_field = f"{action}s"
    current_count = startup.get(count_field, 0) + 1
    
    db.update_item(
        Key={"PK": f"STARTUP#{id}", "SK": "METADATA"},
        UpdateExpression=f"SET {count_field} = :val",
        ExpressionAttributeValues={":val": current_count}
    )
    
    # Store user interaction record
    db.put_item({
        "PK": f"USER#{user['id']}#INTERACT",
        "SK": f"TYPE#{action.upper()}#{id}",
        "entityId": id,
        "entityType": "startup",
        "createdAt": int(time.time())
    })
    
    return {"message": f"Successfully performed {action} on startup", f"{action}s": current_count}

@router.post("/startups/{id}/apply")
def apply_to_startup(id: str, body: ApplyJoinRequest, user: dict = Depends(get_current_user)):
    res = db.get_item({"PK": f"STARTUP#{id}", "SK": "METADATA"})
    startup = res.get("Item")
    if not startup:
        raise HTTPException(status_code=404, detail="Startup listing not found")
        
    app_id = str(uuid.uuid4())
    app_item = {
        "PK": f"STARTUP#{id}#APPLICATION",
        "SK": f"APP#{app_id}",
        "id": app_id,
        "startupId": id,
        "startupName": startup["name"],
        "applicantId": user["id"],
        "applicantName": user["fullName"],
        "roleInterested": body.roleInterested,
        "coverLetter": body.coverLetter,
        "portfolioLinks": body.portfolioLinks,
        "status": "pending",
        "createdAt": int(time.time())
    }
    db.put_item(app_item)
    return {"message": "Application submitted successfully", "applicationId": app_id}

# ==========================================
# MODULE 8: CO-FOUNDER MATCHING
# ==========================================
@router.post("/cofounder", response_model=CoFounderProfileResponse)
def create_cofounder_profile(body: CoFounderProfileCreate, user: dict = Depends(get_current_user)):
    item = {
        "PK": f"COFOUNDER#{user['id']}",
        "SK": "METADATA",
        "GSI1PK": "COFOUNDERS",
        "GSI1SK": f"USER#{user['id']}",
        "userId": user["id"],
        "fullName": user["fullName"],
        "skills": body.skills,
        "industryExperience": body.industryExperience,
        "preferredRoles": body.preferredRoles,
        "desiredCoFounderSkills": body.desiredCoFounderSkills,
        "commitmentLevel": body.commitmentLevel,
        "location": body.location,
        "createdAt": int(time.time())
    }
    db.put_item(item)
    return item

@router.get("/cofounder", response_model=List[dict])
def list_cofounder_profiles():
    res = db.query(
        KeyConditionExpression="GSI1PK = :pk",
        ExpressionAttributeValues={":pk": "COFOUNDERS"},
        IndexName="GSI1"
    )
    return res.get("Items", [])

# ==========================================
# STARTUP WORKSPACES & COLLABORATION
# ==========================================
from pydantic import BaseModel

class TaskCreate(BaseModel):
    title: str
    assignee: Optional[str] = "Founder"
    dueDate: Optional[str] = None

class TaskUpdate(BaseModel):
    status: str # completed, pending

class CommentCreate(BaseModel):
    content: str
    author: Optional[str] = None

class DocumentCreate(BaseModel):
    name: str
    url: str

class WorkspaceCreate(BaseModel):
    name: str
    ideaSummary: Optional[str] = ""
    costEstimate: Optional[float] = 5000.0
    launchTimeline: Optional[str] = "30 Days"
    stage: Optional[str] = "MVP"

def seed_workspace_item(id: str, name: str, founder_id: str, industry: str) -> dict:
    is_healthcare = industry == "Healthcare"
    item = {
        "PK": f"WORKSPACE#{id}",
        "SK": "METADATA",
        "GSI1PK": "WORKSPACES",
        "GSI1SK": f"USER#{founder_id}",
        "id": id,
        "name": name,
        "ideaSummary": "AI-powered diagnostics scanner utilizing vision and NLP classifiers." if is_healthcare else "Autonomous yield forecaster using remote satellite imagery and moisture networks.",
        "costEstimate": 12000.0 if is_healthcare else 6500.0,
        "launchTimeline": "45 Days" if is_healthcare else "28 Days",
        "stage": "MVP",
        "founderId": founder_id,
        "healthScore": 92 if is_healthcare else 88,
        "readinessScore": 89 if is_healthcare else 84,
        "fundingReadiness": 85 if is_healthcare else 72,
        "executionScore": 85 if is_healthcare else 90,
        "growthScore": 79 if is_healthcare else 65,
        "riskScore": 12 if is_healthcare else 20,
        "teamStrength": 94 if is_healthcare else 85,
        "tasks": [
            {"id": "t1", "title": "Secure brand domain mediscan.ai" if is_healthcare else "Secure cropvision.ai", "status": "completed", "assignee": "Founder", "dueDate": "2026-06-01"},
            {"id": "t2", "title": "Configure HIPAA data-pipeline compliant storage" if is_healthcare else "Purchase soil yield sensors", "status": "completed", "assignee": "Founder", "dueDate": "2026-06-05"},
            {"id": "t3", "title": "Deploy ResNet tumor detection model" if is_healthcare else "Deploy crop prediction model", "status": "completed", "assignee": "Priya Sharma", "dueDate": "2026-06-09"},
            {"id": "t4", "title": "Integrate front-end patient record intake" if is_healthcare else "Build mobile map dashboard", "status": "pending", "assignee": "Aarav Patel", "dueDate": "2026-06-18"},
            {"id": "t5", "title": "Perform medical validation compliance checks" if is_healthcare else "Beta test with organic farm networks", "status": "pending", "assignee": "Founder", "dueDate": "2026-06-25"}
        ],
        "comments": [
            {"id": "c1", "author": "Priya Sharma", "content": "Successfully trained classification weights with 99.4% precision.", "createdAt": int(time.time() - 86400)},
            {"id": "c2", "author": "Aarav Patel", "content": "Set up WebGL visual maps for field grid systems.", "createdAt": int(time.time() - 36000)}
        ],
        "documents": [
            {"id": "d1", "name": "FDA Regulatory Compliance Deck" if is_healthcare else "Agricultural Agronomy Roadmap", "url": "https://storage.launchhub.ai/compliance.pdf"},
            {"id": "d2", "name": "Venture Architecture Blueprint", "url": "https://storage.launchhub.ai/blueprint.pdf"}
        ],
        "team": [
            {"name": "Aditi Sharma", "role": "Founder"},
            {"name": "Priya Sharma", "role": "AI Engineer"},
            {"name": "Aarav Patel", "role": "Developer"}
        ],
        "assets": [
            {"name": "mediscan.ai" if is_healthcare else "cropvision.ai", "type": "Domain"},
            {"name": "Automated Medical Invoicing Tool" if is_healthcare else "B2B CRM for Retail Storefronts", "type": "SaaS codebase"},
            {"name": "Lung Tumor Classification ResNet Model" if is_healthcare else "FastAPI AI Customer Support Agent", "type": "AI Asset"}
        ],
        "milestones": [
            {"step": 1, "title": "Design Yantra Architecture Map", "status": "completed"},
            {"step": 2, "title": "Acquire Domains & Code Bases", "status": "completed"},
            {"step": 3, "title": "Staff Guild Engineering Roles", "status": "completed"},
            {"step": 4, "title": "Validate Beta Prototypes", "status": "pending"},
            {"step": 5, "title": "Venture Pitch & Capital Connect", "status": "pending"}
        ],
        "funding": {
            "raised": 25000.0 if is_healthcare else 12000.0,
            "target": 150000.0 if is_healthcare else 80000.0,
            "stage": "MVP",
            "valuation": 800000.0 if is_healthcare else 500000.0
        },
        "aiAssets": {
            "datasets": [
                {
                    "id": "seed-ds-1",
                    "title": "100k Anonymized ECG Scans" if is_healthcare else "Crop Yield Remote Sensing Data",
                    "price": 950.0 if is_healthcare else 600.0,
                    "format": "DICOM/JSON" if is_healthcare else "GeoTIFF/CSV",
                    "qualityScore": 94.0,
                    "size": "1.2 GB"
                }
            ],
            "models": [
                {
                    "id": "seed-model-1",
                    "title": "Lung Tumor Classification ResNet Model" if is_healthcare else "Crop Yield Forecasting LSTM",
                    "price": 2800.0 if is_healthcare else 1900.0,
                    "framework": "PyTorch",
                    "accuracy": 0.945 if is_healthcare else 0.925
                }
            ],
            "agents": [
                {
                    "id": "seed-agent-1",
                    "title": "FastAPI AI Customer Support Agent",
                    "price": 49.0,
                    "accessType": "monthly"
                }
            ],
            "aiAssetCost": 3799.0 if is_healthcare else 2549.0,
            "aiInfrastructureCost": 1200.0 if is_healthcare else 800.0,
            "aiReadinessScore": 88 if is_healthcare else 78
        },
        "createdAt": int(time.time() - 86400 * 5)
    }
    db.put_item(item)
    return item

@router.get("/workspaces")
def list_workspaces(user: dict = Depends(get_current_user)):
    res = db.query(
        KeyConditionExpression="GSI1PK = :pk AND begins_with(GSI1SK, :sk)",
        ExpressionAttributeValues={":pk": "WORKSPACES", ":sk": f"USER#{user['id']}"},
        IndexName="GSI1"
    )
    items = res.get("Items", [])
    
    # Fallback to scanning/seeding if query returns empty in mock mode
    if not items and hasattr(db.client, "db"):
        items = [x for x in db.client.db if x.get("PK", "").startswith("WORKSPACE#") and x.get("founderId") == user["id"]]
    
    # Auto-seed the two main workspaces if user has none
    if not items:
        ws1 = seed_workspace_item("mediscan-ai", "Mediscan AI Workspace", user["id"], "Healthcare")
        ws2 = seed_workspace_item("cropvision-ai", "CropVision AI Workspace", user["id"], "Agriculture")
        items = [ws1, ws2]
        
    return items

@router.get("/workspaces/{id}")
def get_workspace(id: str, user: dict = Depends(get_current_user)):
    res = db.get_item({"PK": f"WORKSPACE#{id}", "SK": "METADATA"})
    workspace = res.get("Item")
    if not workspace:
        if id == "mediscan-ai":
            workspace = seed_workspace_item("mediscan-ai", "Mediscan AI Workspace", user["id"], "Healthcare")
        elif id == "cropvision-ai":
            workspace = seed_workspace_item("cropvision-ai", "CropVision AI Workspace", user["id"], "Agriculture")
        else:
            raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace

@router.post("/workspaces")
def create_workspace(body: WorkspaceCreate, user: dict = Depends(get_current_user)):
    ws_id = str(uuid.uuid4())
    item = {
        "PK": f"WORKSPACE#{ws_id}",
        "SK": "METADATA",
        "GSI1PK": "WORKSPACES",
        "GSI1SK": f"USER#{user['id']}",
        "id": ws_id,
        "name": body.name,
        "ideaSummary": body.ideaSummary,
        "costEstimate": body.costEstimate,
        "launchTimeline": body.launchTimeline,
        "stage": body.stage,
        "founderId": user["id"],
        "healthScore": 85,
        "readinessScore": 80,
        "fundingReadiness": 75,
        "executionScore": 80,
        "growthScore": 70,
        "riskScore": 30,
        "teamStrength": 75,
        "tasks": [
            {"id": "t1", "title": "Setup Repository & Deploy Landing Page", "status": "completed", "assignee": "Founder", "dueDate": "2026-06-15"},
            {"id": "t2", "title": "Link Domain & SSL Certificates", "status": "completed", "assignee": "Founder", "dueDate": "2026-06-18"},
            {"id": "t3", "title": "Initialize Database & API endpoints", "status": "pending", "assignee": "Developer", "dueDate": "2026-06-25"},
            {"id": "t4", "title": "Configure AI Model Integration", "status": "pending", "assignee": "AI Engineer", "dueDate": "2026-06-29"}
        ],
        "comments": [
            {"id": "c1", "author": "Priya Sharma", "content": "Connected pre-trained ML classifier to backend API.", "createdAt": int(time.time() - 3600)},
            {"id": "c2", "author": "Aarav Patel", "content": "Configured OAuth login modules on staging branch.", "createdAt": int(time.time() - 7200)}
        ],
        "documents": [
            {"id": "d1", "name": "Venture Architecture Blueprint", "url": "https://docs.launchhub.ai/blueprint.pdf"},
            {"id": "d2", "name": "Pitch Deck Slides", "url": "https://docs.launchhub.ai/pitch-deck.pdf"}
        ],
        "team": [
            {"name": user["fullName"], "role": "Founder"},
            {"name": "Priya Sharma", "role": "AI Engineer"},
            {"name": "Aarav Patel", "role": "Developer"}
        ],
        "assets": [
            {"name": f"{body.name.lower().replace(' ', '')}.ai", "type": "Domain"},
            {"name": "FastAPI AI Customer Support Agent", "type": "AI Asset"}
        ],
        "milestones": [
            {"step": 1, "title": "Design Yantra Architecture Map", "status": "completed"},
            {"step": 2, "title": "Acquire Domains & Code Bases", "status": "completed"},
            {"step": 3, "title": "Staff Guild Engineering Roles", "status": "completed"},
            {"step": 4, "title": "Validate Beta Prototypes", "status": "pending"},
            {"step": 5, "title": "Venture Pitch & Capital Connect", "status": "pending"}
        ],
        "funding": {
            "raised": 15000.0,
            "target": body.costEstimate * 10,
            "stage": body.stage,
            "valuation": body.costEstimate * 50
        },
        "aiAssets": {
            "datasets": [],
            "models": [],
            "agents": [
                {
                    "id": "seed-agent-1",
                    "title": "FastAPI AI Customer Support Agent",
                    "price": 49.0,
                    "accessType": "monthly"
                }
            ],
            "aiAssetCost": 49.0,
            "aiInfrastructureCost": 450.0,
            "aiReadinessScore": 45
        },
        "createdAt": int(time.time())
    }
    db.put_item(item)
    return item

@router.post("/workspaces/{id}/tasks")
def add_task(id: str, body: TaskCreate, user: dict = Depends(get_current_user)):
    res = db.get_item({"PK": f"WORKSPACE#{id}", "SK": "METADATA"})
    workspace = res.get("Item")
    if not workspace:
        if id in ["mediscan-ai", "cropvision-ai"]:
            workspace = seed_workspace_item(id, id.replace("-", " ").title() + " Workspace", user["id"], "Healthcare" if "medi" in id else "Agriculture")
        else:
            raise HTTPException(status_code=404, detail="Workspace not found")
            
    tasks = workspace.get("tasks", [])
    task_id = str(uuid.uuid4())[:8]
    new_task = {
        "id": task_id,
        "title": body.title,
        "status": "pending",
        "assignee": body.assignee,
        "dueDate": body.dueDate or time.strftime("%Y-%m-%d", time.localtime(time.time() + 3600 * 24 * 7))
    }
    tasks.append(new_task)
    workspace["tasks"] = tasks
    
    completed_count = len([t for t in tasks if t["status"] == "completed"])
    execution_score = int((completed_count / len(tasks)) * 100) if tasks else 100
    workspace["executionScore"] = execution_score
    workspace["healthScore"] = int((execution_score + workspace.get("readinessScore", 80) + workspace.get("teamStrength", 80)) / 3)

    db.put_item(workspace)
    return new_task

@router.patch("/workspaces/{id}/tasks/{taskId}")
def update_task(id: str, taskId: str, body: TaskUpdate, user: dict = Depends(get_current_user)):
    res = db.get_item({"PK": f"WORKSPACE#{id}", "SK": "METADATA"})
    workspace = res.get("Item")
    if not workspace:
        if id in ["mediscan-ai", "cropvision-ai"]:
            workspace = seed_workspace_item(id, id.replace("-", " ").title() + " Workspace", user["id"], "Healthcare" if "medi" in id else "Agriculture")
        else:
            raise HTTPException(status_code=404, detail="Workspace not found")
            
    tasks = workspace.get("tasks", [])
    found = False
    for task in tasks:
        if task["id"] == taskId:
            task["status"] = body.status
            found = True
            break
            
    if not found:
        raise HTTPException(status_code=404, detail="Task not found")
        
    workspace["tasks"] = tasks
    completed_count = len([t for t in tasks if t["status"] == "completed"])
    execution_score = int((completed_count / len(tasks)) * 100) if tasks else 100
    workspace["executionScore"] = execution_score
    workspace["healthScore"] = int((execution_score + workspace.get("readinessScore", 80) + workspace.get("teamStrength", 80)) / 3)
    
    db.put_item(workspace)
    return {"message": "Task updated successfully", "tasks": tasks}

@router.post("/workspaces/{id}/comments")
def add_comment(id: str, body: CommentCreate, user: dict = Depends(get_current_user)):
    res = db.get_item({"PK": f"WORKSPACE#{id}", "SK": "METADATA"})
    workspace = res.get("Item")
    if not workspace:
        if id in ["mediscan-ai", "cropvision-ai"]:
            workspace = seed_workspace_item(id, id.replace("-", " ").title() + " Workspace", user["id"], "Healthcare" if "medi" in id else "Agriculture")
        else:
            raise HTTPException(status_code=404, detail="Workspace not found")
            
    comments = workspace.get("comments", [])
    comment_id = str(uuid.uuid4())[:8]
    new_comment = {
        "id": comment_id,
        "author": body.author or user["fullName"],
        "content": body.content,
        "createdAt": int(time.time())
    }
    comments.append(new_comment)
    workspace["comments"] = comments
    db.put_item(workspace)
    return new_comment

@router.post("/workspaces/{id}/documents")
def add_document(id: str, body: DocumentCreate, user: dict = Depends(get_current_user)):
    res = db.get_item({"PK": f"WORKSPACE#{id}", "SK": "METADATA"})
    workspace = res.get("Item")
    if not workspace:
        if id in ["mediscan-ai", "cropvision-ai"]:
            workspace = seed_workspace_item(id, id.replace("-", " ").title() + " Workspace", user["id"], "Healthcare" if "medi" in id else "Agriculture")
        else:
            raise HTTPException(status_code=404, detail="Workspace not found")
            
    docs = workspace.get("documents", [])
    doc_id = str(uuid.uuid4())[:8]
    new_doc = {
        "id": doc_id,
        "name": body.name,
        "url": body.url
    }
    docs.append(new_doc)
    workspace["documents"] = docs
    db.put_item(workspace)
    return new_doc

class AddAiAssetBody(BaseModel):
    assetId: str
    assetTitle: str
    assetPrice: float
    assetType: str # dataset, model, agent
    format: Optional[str] = None
    framework: Optional[str] = None
    accuracy: Optional[float] = None
    qualityScore: Optional[float] = None

@router.post("/workspaces/{id}/ai-assets")
def add_ai_asset(id: str, body: AddAiAssetBody, user: dict = Depends(get_current_user)):
    res = db.get_item({"PK": f"WORKSPACE#{id}", "SK": "METADATA"})
    workspace = res.get("Item")
    if not workspace:
        if id in ["mediscan-ai", "cropvision-ai"]:
            workspace = seed_workspace_item(id, id.replace("-", " ").title() + " Workspace", user["id"], "Healthcare" if "medi" in id else "Agriculture")
        else:
            raise HTTPException(status_code=404, detail="Workspace not found")
        
    ai_assets = workspace.get("aiAssets", {
        "datasets": [],
        "models": [],
        "agents": [],
        "aiAssetCost": 0.0,
        "aiInfrastructureCost": 450.0,
        "aiReadinessScore": 30
    })
    
    # Initialize lists if they don't exist
    if "datasets" not in ai_assets: ai_assets["datasets"] = []
    if "models" not in ai_assets: ai_assets["models"] = []
    if "agents" not in ai_assets: ai_assets["agents"] = []
    
    new_asset = {
        "id": body.assetId,
        "title": body.assetTitle,
        "price": body.assetPrice
    }
    
    if body.assetType.lower() == "dataset":
        new_asset["format"] = body.format or "CSV"
        new_asset["qualityScore"] = body.qualityScore or 90.0
        ai_assets["datasets"].append(new_asset)
    elif body.assetType.lower() == "model":
        new_asset["framework"] = body.framework or "PyTorch"
        new_asset["accuracy"] = body.accuracy or 0.90
        ai_assets["models"].append(new_asset)
    elif body.assetType.lower() == "agent":
        ai_assets["agents"].append(new_asset)
        
    # Recalculate costs
    total_cost = sum(float(x.get("price", 0.0)) for x in ai_assets.get("datasets", [])) + \
                 sum(float(x.get("price", 0.0)) for x in ai_assets.get("models", [])) + \
                 sum(float(x.get("price", 0.0)) for x in ai_assets.get("agents", []))
    ai_assets["aiAssetCost"] = round(total_cost, 2)
    
    # Recalculate AI readiness score
    dataset_count = len(ai_assets.get("datasets", []))
    model_count = len(ai_assets.get("models", []))
    agent_count = len(ai_assets.get("agents", []))
    
    team_strength = workspace.get("teamStrength", 80)
    readiness = 30 + min(dataset_count * 15, 30) + min(model_count * 20, 40) + min(agent_count * 10, 20) + min(team_strength // 5, 10)
    ai_assets["aiReadinessScore"] = min(readiness, 100)
    
    workspace["aiAssets"] = ai_assets
    workspace["readinessScore"] = ai_assets["aiReadinessScore"] # sync workspace-level readinessScore
    
    db.put_item(workspace)
    return {"message": "AI Asset added successfully", "aiAssets": ai_assets}

