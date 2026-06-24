import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import db
from app.routers import (
    auth,
    marketplace,
    talent,
    startups,
    investors,
    messaging,
    verification,
    navigator,
    blueprint
)

app = FastAPI(
    title="LaunchHub AI API",
    description="The Operating System and Asset Exchange for Startups",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to Next.js dev url
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include modular routers under v1 prefix
api_prefix = "/api/v1"
app.include_router(auth.router, prefix=api_prefix)
app.include_router(marketplace.router, prefix=api_prefix)
app.include_router(talent.router, prefix=api_prefix)
app.include_router(startups.router, prefix=api_prefix)
app.include_router(investors.router, prefix=api_prefix)
app.include_router(messaging.router, prefix=api_prefix)
app.include_router(verification.router, prefix=api_prefix)
app.include_router(navigator.router, prefix=api_prefix)
app.include_router(blueprint.router, prefix=api_prefix)

# Seeding routine for Demo / Mock data
def seed_mock_data():
    # Check if there are any assets in either mock or real database
    if hasattr(db.client, "db"):
        items = db.client.db
        has_assets = any(x.get("PK", "").startswith("ASSET#") for x in items)
    else:
        try:
            res = db.scan()
            has_assets = any(x.get("PK", "").startswith("ASSET#") for x in res.get("Items", []))
        except Exception as scan_err:
            print(f"Error checking assets in real DynamoDB: {str(scan_err)}")
            has_assets = True # Avoid writing on errors
            
    if has_assets:
        print("Database already seeded. Skipping seed routine.")
        return
        
    print("Seeding LaunchHub AI Database with demo marketplace listings...")
    
    # 1. Domains
    domains = [
        {"name": "fintechflow", "ext": ".ai", "cat": "Finance", "price": 850.0, "lease": 75.0, "traffic": 1200, "age": 2},
        {"name": "mediscan", "ext": ".ai", "cat": "Healthcare", "price": 1200.0, "lease": 110.0, "traffic": 850, "age": 3},
        {"name": "edulearn", "ext": ".ai", "cat": "Education", "price": 450.0, "lease": 40.0, "traffic": 1800, "age": 1},
        {"name": "cropvision", "ext": ".ai", "cat": "Agriculture", "price": 600.0, "lease": 50.0, "traffic": 400, "age": 1},
        {"name": "shopexpress", "ext": ".ai", "cat": "Ecommerce", "price": 350.0, "lease": 30.0, "traffic": 2500, "age": 2}
    ]
    for d in domains:
        asset_id = f"seed-dom-{d['name']}"
        db.put_item({
            "PK": f"ASSET#DOMAIN#{asset_id}",
            "SK": "METADATA",
            "GSI1PK": "ASSETS#DOMAIN",
            "GSI1SK": f"PRICE#{d['price']}",
            "id": asset_id,
            "name": f"{d['name']}{d['ext']}",
            "extension": d["ext"],
            "category": d["cat"],
            "price": d["price"],
            "leasePrice": d["lease"],
            "traffic": d["traffic"],
            "age": d["age"],
            "description": f"Highly brandable premium {d['cat']} domain name. Ideal for AI-first applications.",
            "sellerId": "seed-seller-1",
            "verificationStatus": "verified",
            "status": "active",
            "createdAt": int(time.time())
        })

    # 2. Websites & SaaS
    saas = [
        {"title": "B2B CRM for Retail Storefronts", "cat": "Ecommerce", "rev": 12500.0, "mrr": 1100.0, "users": 150, "price": 12000.0},
        {"title": "AI Resume Screener SaaS", "cat": "Education", "rev": 4800.0, "mrr": 400.0, "users": 80, "price": 4500.0},
        {"title": "Automated Medical Invoicing Tool", "cat": "Healthcare", "rev": 25000.0, "mrr": 2100.0, "users": 310, "price": 24000.0}
    ]
    for s in saas:
        asset_id = f"seed-saas-{s['title'].replace(' ', '-').lower()}"
        db.put_item({
            "PK": f"ASSET#WEBSITE#{asset_id}",
            "SK": "METADATA",
            "GSI1PK": "ASSETS#WEBSITE",
            "GSI1SK": f"REVENUE#{s['mrr']}",
            "id": asset_id,
            "title": s["title"],
            "category": s["cat"],
            "description": f"Fully operational SaaS project with verified Stripe integration. Features clean React+FastAPI stack and active users.",
            "revenue": s["rev"],
            "users": s["users"],
            "mrr": s["mrr"],
            "arr": s["mrr"] * 12,
            "traffic": s["users"] * 12,
            "stack": ["React", "FastAPI", "PostgreSQL", "Tailwind CSS"],
            "demoUrl": f"https://demo.{s['title'].split()[0].lower()}.com",
            "askingPrice": s["price"],
            "price": s["price"],
            "sellerId": "seed-seller-2",
            "status": "active",
            "createdAt": int(time.time())
        })

    # 3. Mobile Apps
    apps = [
        {"title": "AI Calorie Tracker", "cat": "Healthcare", "downloads": 32000, "rev": 850.0, "plat": "iOS", "price": 4900.0},
        {"title": "Micro-Investment Planner", "cat": "Finance", "downloads": 15000, "rev": 450.0, "plat": "Android", "price": 2800.0},
        {"title": "Online Quiz App Generator", "cat": "Education", "downloads": 54000, "rev": 1200.0, "plat": "Web", "price": 6500.0}
    ]
    for a in apps:
        asset_id = f"seed-app-{a['title'].replace(' ', '-').lower()}"
        db.put_item({
            "PK": f"ASSET#APP#{asset_id}",
            "SK": "METADATA",
            "GSI1PK": "ASSETS#APP",
            "GSI1SK": f"DOWNLOADS#{a['downloads']}",
            "id": asset_id,
            "title": a["title"],
            "category": a["cat"],
            "description": f"Premium {a['plat']} application available for transfer. Includes production source code, asset licenses, and support.",
            "downloads": a["downloads"],
            "revenue": a["rev"],
            "platform": a["plat"],
            "price": a["price"],
            "sellerId": "seed-seller-3",
            "status": "active",
            "createdAt": int(time.time())
        })

    # 4. AI Assets
    ai_assets = [
        # Datasets
        {
            "title": "100k Anonymized ECG Scans",
            "cat": "Healthcare",
            "sub": "Datasets",
            "price": 950.0,
            "type": "buy",
            "rentPrice": 95.0,
            "subscriptionPrice": 120.0,
            "industry": "Healthcare",
            "format": "DICOM / JSON",
            "datasetSize": "1.2 GB",
            "numberOfRecords": 100000,
            "dataQualityScore": 94.0,
            "coverageScore": 88.0,
            "biasAnalysis": "Slight gender skew balanced by synthetic augmentation.",
            "samplePreview": "{\"records\": [{\"patient_id\": \"ECG-0482\", \"lead_I\": [0.12, 0.15], \"diagnosis\": \"Arrhythmia\"}]}",
            "licenseType": "Commercial Use License",
            "commercialUsage": True,
            "biasRiskScore": 15.0,
            "startupCompatibilityScore": 92.0,
            "industryFitScore": 95.0,
            "commercialReadinessScore": 90.0
        },
        {
            "title": "Stripe B2B Payment Log Stream",
            "cat": "Finance",
            "sub": "Datasets",
            "price": 450.0,
            "type": "buy",
            "rentPrice": 45.0,
            "subscriptionPrice": 60.0,
            "industry": "Finance",
            "format": "JSON / CSV",
            "datasetSize": "850 MB",
            "numberOfRecords": 250000,
            "dataQualityScore": 97.0,
            "coverageScore": 92.0,
            "biasAnalysis": "No significant geo-bias detected.",
            "samplePreview": "{\"records\": [{\"tx_id\": \"TX-90231\", \"amount\": 420.50, \"currency\": \"USD\", \"risk_label\": \"legit\"}]}",
            "licenseType": "Standard Dev License",
            "commercialUsage": True,
            "biasRiskScore": 5.0,
            "startupCompatibilityScore": 95.0,
            "industryFitScore": 94.0,
            "commercialReadinessScore": 96.0
        },
        {
            "title": "Crop Disease Detection Images",
            "cat": "Agriculture",
            "sub": "Datasets",
            "price": 600.0,
            "type": "buy",
            "rentPrice": 60.0,
            "subscriptionPrice": 80.0,
            "industry": "Agriculture",
            "format": "JPEG / XML",
            "datasetSize": "2.4 GB",
            "numberOfRecords": 35000,
            "dataQualityScore": 89.0,
            "coverageScore": 85.0,
            "biasAnalysis": "Niche focus on tropical crop strains.",
            "samplePreview": "{\"records\": [{\"img_id\": \"AGRI-381\", \"labels\": [\"leaf_rust\"], \"confidence\": 1.0}]}",
            "licenseType": "Open Commercial License",
            "commercialUsage": True,
            "biasRiskScore": 20.0,
            "startupCompatibilityScore": 86.0,
            "industryFitScore": 90.0,
            "commercialReadinessScore": 84.0
        },
        # ML Models
        {
            "title": "Lung Tumor Classification ResNet Model",
            "cat": "Healthcare",
            "sub": "ML Models",
            "price": 2800.0,
            "type": "buy",
            "framework": "PyTorch",
            "accuracy": 0.945,
            "precision": 0.938,
            "recall": 0.952,
            "f1Score": 0.945,
            "inferenceCost": "$0.005 per scan",
            "trainingDataset": "100k Anonymized ECG Scans & NIH ChestXray14",
            "supportedIndustries": ["Healthcare", "Clinical Diagnostics"],
            "documentation": "https://docs.launchhub.ai/models/resnet-lung-tumor",
            "demo": "https://demo.launchhub.ai/models/resnet-lung-tumor",
            "productionReadinessScore": 92.0,
            "costEfficiencyScore": 88.0,
            "scalabilityScore": 95.0,
            "industryCompatibilityScore": 94.0,
            "startupCompatibilityScore": 90.0
        },
        {
            "title": "Financial Trend Forecaster LSTM",
            "cat": "Finance",
            "sub": "ML Models",
            "price": 1900.0,
            "type": "buy",
            "framework": "TensorFlow",
            "accuracy": 0.895,
            "precision": 0.884,
            "recall": 0.902,
            "f1Score": 0.893,
            "inferenceCost": "$0.001 per forecast tick",
            "trainingDataset": "Stripe B2B Payment Log Stream & Yahoo Finance API",
            "supportedIndustries": ["Finance", "Quantitative Trading"],
            "documentation": "https://docs.launchhub.ai/models/lstm-trend-forecaster",
            "demo": "https://demo.launchhub.ai/models/lstm-trend-forecaster",
            "productionReadinessScore": 88.0,
            "costEfficiencyScore": 92.0,
            "scalabilityScore": 90.0,
            "industryCompatibilityScore": 91.0,
            "startupCompatibilityScore": 93.0
        },
        # AI Agents
        {
            "title": "FastAPI AI Customer Support Agent",
            "cat": "Finance",
            "sub": "AI Agents",
            "price": 49.0,
            "type": "monthly",
            "rentPrice": 49.0
        },
        {
            "title": "HR Recruiter Pipeline Agent",
            "cat": "General",
            "sub": "AI Agents",
            "price": 79.0,
            "type": "monthly",
            "rentPrice": 79.0
        },
        # AI Workflows
        {
            "title": "Patient Onboarding Node Pipeline",
            "cat": "Healthcare",
            "sub": "AI Workflows",
            "price": 250.0,
            "type": "buy"
        },
        # Prompt Libraries
        {
            "title": "Startup Yantra Prompts Deck",
            "cat": "General",
            "sub": "Prompt Libraries",
            "price": 19.0,
            "type": "buy"
        }
    ]
    for ai in ai_assets:
        asset_id = f"seed-ai-{ai['title'].replace(' ', '-').lower()}"
        item = {
            "PK": f"ASSET#AI#{asset_id}",
            "SK": "METADATA",
            "GSI1PK": f"ASSETS#AI#{ai['sub']}",
            "GSI1SK": f"PRICE#{ai['price']}",
            "id": asset_id,
            "title": ai["title"],
            "description": ai.get("description", f"Verified {ai['sub']} ready for startup integration. Guaranteed compliance and premium accuracy benchmarks."),
            "category": ai["cat"],
            "subCategory": ai["sub"],
            "price": ai["price"],
            "accessType": ai["type"],
            "rentPrice": ai.get("rentPrice"),
            "subscriptionPrice": ai.get("subscriptionPrice"),
            "sellerId": "seed-seller-ai",
            "status": "active",
            "createdAt": int(time.time()),
            "verificationStatus": "verified"
        }
        
        # Dataset fields
        for field in ["industry", "format", "datasetSize", "numberOfRecords", "dataQualityScore", 
                      "coverageScore", "biasAnalysis", "samplePreview", "licenseType", "commercialUsage"]:
            if field in ai:
                item[field] = ai[field]
                
        # Model fields
        for field in ["framework", "accuracy", "precision", "recall", "f1Score", "inferenceCost", 
                      "trainingDataset", "supportedIndustries", "documentation", "demo"]:
            if field in ai:
                item[field] = ai[field]
                
        # Intelligence scores
        for field in ["biasRiskScore", "startupCompatibilityScore", "industryFitScore", "commercialReadinessScore",
                      "productionReadinessScore", "costEfficiencyScore", "scalabilityScore", "industryCompatibilityScore"]:
            if field in ai:
                item[field] = ai[field]
                
        db.put_item(item)

    # 5. Talent
    talents = [
        {"name": "Priya Sharma", "role": "AI Engineer", "rate": 85.0, "skills": ["Python", "PyTorch", "LangChain", "FastAPI"], "avail": "20 hrs/week"},
        {"name": "Aarav Patel", "role": "Developer", "rate": 65.0, "skills": ["TypeScript", "Next.js", "Tailwind CSS", "React"], "avail": "Full-time"},
        {"name": "Neha Iyer", "role": "Designer", "rate": 60.0, "skills": ["Figma", "UI/UX", "Brand Design", "Framer"], "avail": "30 hrs/week"}
    ]
    for t in talents:
        talent_id = f"seed-talent-{t['name'].replace(' ', '-').lower()}"
        db.put_item({
            "PK": f"TALENT#{talent_id}",
            "SK": "METADATA",
            "GSI1PK": f"TALENT#ROLE#{t['role']}",
            "GSI1SK": f"RATE#{t['rate']}",
            "userId": talent_id,
            "fullName": t["name"],
            "role": t["role"],
            "skills": t["skills"],
            "ratePerHour": t["rate"],
            "availability": t["avail"],
            "portfolio": ["https://portfolio.launchhub.ai/" + t["name"].split()[0].lower()],
            "rating": 4.9,
            "reviewsCount": 14,
            "trustScore": 92,
            "createdAt": int(time.time())
        })

    # 6. Investors
    investors = [
        {"name": "Nexus Venture Partners", "org": "Nexus VC", "focus": ["Healthcare", "Finance"], "ticket": "$100k - $500k", "stage": ["MVP", "Growth"]},
        {"name": "Aurora Capital Group", "org": "Aurora Fund", "focus": ["Education", "Agriculture"], "ticket": "$50k - $150k", "stage": ["Idea", "MVP"]},
        {"name": "Stellar Seed Angel", "org": "Stellar Network", "focus": ["Ecommerce", "General"], "ticket": "$10k - $50k", "stage": ["Idea"]}
    ]
    for inv in investors:
        inv_id = f"seed-inv-{inv['name'].replace(' ', '-').lower()}"
        db.put_item({
            "PK": f"INVESTOR#{inv_id}",
            "SK": "METADATA",
            "GSI1PK": "INVESTORS",
            "GSI1SK": f"NAME#{inv['name']}",
            "userId": inv_id,
            "name": inv["name"],
            "organization": inv["org"],
            "industryFocus": inv["focus"],
            "ticketSize": inv["ticket"],
            "stagePreference": inv["stage"],
            "createdAt": int(time.time())
        })
    print("Database seeding completed.")

@app.on_event("startup")
def startup_event():
    seed_mock_data()

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "LaunchHub AI Backend API Engine",
        "timestamp": int(time.time())
    }
