"""
Reseed missing marketplace data into AWS DynamoDB.
Skips domains (already seeded). Inserts websites, apps, AI assets, talent, investors.
"""
import os
import sys
import time
from decimal import Decimal

import boto3
from botocore.exceptions import ClientError

def load_env(filepath):
    env = {}
    with open(filepath) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip()
    return env

def dec(val):
    """Convert float to Decimal for DynamoDB compatibility."""
    if isinstance(val, float):
        return Decimal(str(val))
    if isinstance(val, dict):
        return {k: dec(v) for k, v in val.items()}
    if isinstance(val, list):
        return [dec(v) for v in val]
    return val

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
env = load_env(env_path)

dynamodb = boto3.resource(
    "dynamodb",
    region_name=env.get("AWS_REGION", "us-east-1"),
    aws_access_key_id=env["AWS_ACCESS_KEY_ID"],
    aws_secret_access_key=env["AWS_SECRET_ACCESS_KEY"]
)
table = dynamodb.Table(env.get("DYNAMODB_TABLE_NAME", "LaunchHubTable"))

def put(item):
    table.put_item(Item=dec(item))

now = int(time.time())

print("Seeding Websites / SaaS...")
saas = [
    {"title": "B2B CRM for Retail Storefronts",      "cat": "Ecommerce",  "rev": 12500.0, "mrr": 1100.0, "users": 150, "price": 12000.0},
    {"title": "AI Resume Screener SaaS",              "cat": "Education",  "rev": 4800.0,  "mrr": 400.0,  "users": 80,  "price": 4500.0},
    {"title": "Automated Medical Invoicing Tool",     "cat": "Healthcare", "rev": 25000.0, "mrr": 2100.0, "users": 310, "price": 24000.0},
    {"title": "Agri Supply Chain Tracker",            "cat": "Agriculture","rev": 8200.0,  "mrr": 680.0,  "users": 95,  "price": 7500.0},
    {"title": "FinTech Expense Analytics Dashboard",  "cat": "Finance",    "rev": 18000.0, "mrr": 1500.0, "users": 210, "price": 16500.0},
]
for s in saas:
    aid = f"seed-saas-{s['title'].replace(' ', '-').lower()}"
    put({
        "PK": f"ASSET#WEBSITE#{aid}", "SK": "METADATA",
        "GSI1PK": "ASSETS#WEBSITE", "GSI1SK": f"REVENUE#{s['mrr']}",
        "id": aid, "title": s["title"], "category": s["cat"],
        "description": f"Fully operational SaaS project with verified Stripe integration. Features clean React+FastAPI stack and active users.",
        "revenue": s["rev"], "users": s["users"], "mrr": s["mrr"], "arr": s["mrr"] * 12,
        "traffic": s["users"] * 12,
        "stack": ["React", "FastAPI", "PostgreSQL", "Tailwind CSS"],
        "demoUrl": f"https://demo.{s['title'].split()[0].lower()}.com",
        "askingPrice": s["price"], "price": s["price"],
        "sellerId": "seed-seller-2", "status": "active", "createdAt": now
    })
print(f"  ✓ {len(saas)} websites seeded")

print("Seeding Mobile / Web Apps...")
apps = [
    {"title": "AI Calorie Tracker",         "cat": "Healthcare", "downloads": 32000, "rev": 850.0,  "plat": "iOS",     "price": 4900.0},
    {"title": "Micro-Investment Planner",   "cat": "Finance",    "downloads": 15000, "rev": 450.0,  "plat": "Android", "price": 2800.0},
    {"title": "Online Quiz App Generator",  "cat": "Education",  "downloads": 54000, "rev": 1200.0, "plat": "Web",     "price": 6500.0},
    {"title": "FarmWatch Crop Monitor",     "cat": "Agriculture","downloads": 8200,  "rev": 320.0,  "plat": "Android", "price": 3200.0},
    {"title": "Shopify Flash Deal Manager", "cat": "Ecommerce",  "downloads": 21000, "rev": 760.0,  "plat": "Web",     "price": 5100.0},
]
for a in apps:
    aid = f"seed-app-{a['title'].replace(' ', '-').lower()}"
    put({
        "PK": f"ASSET#APP#{aid}", "SK": "METADATA",
        "GSI1PK": "ASSETS#APP", "GSI1SK": f"DOWNLOADS#{a['downloads']}",
        "id": aid, "title": a["title"], "category": a["cat"],
        "description": f"Premium {a['plat']} application available for transfer. Includes production source code, asset licenses, and support.",
        "downloads": a["downloads"], "revenue": a["rev"],
        "platform": a["plat"], "price": a["price"],
        "sellerId": "seed-seller-3", "status": "active", "createdAt": now
    })
print(f"  ✓ {len(apps)} apps seeded")

print("Seeding AI Assets (Datasets, Models, Agents, Workflows, Prompts)...")
ai_assets = [
    # --- Datasets ---
    {
        "title": "100k Anonymized ECG Scans", "cat": "Healthcare", "sub": "Datasets",
        "price": 950.0, "type": "buy", "rentPrice": 95.0, "subscriptionPrice": 120.0,
        "industry": "Healthcare", "format": "DICOM / JSON", "datasetSize": "1.2 GB",
        "numberOfRecords": 100000, "dataQualityScore": 94.0, "coverageScore": 88.0,
        "biasAnalysis": "Slight gender skew balanced by synthetic augmentation.",
        "samplePreview": '{"records": [{"patient_id": "ECG-0482", "lead_I": [0.12, 0.15], "diagnosis": "Arrhythmia"}]}',
        "licenseType": "Commercial Use License", "commercialUsage": True,
        "biasRiskScore": 15.0, "startupCompatibilityScore": 92.0,
        "industryFitScore": 95.0, "commercialReadinessScore": 90.0
    },
    {
        "title": "Stripe B2B Payment Log Stream", "cat": "Finance", "sub": "Datasets",
        "price": 450.0, "type": "buy", "rentPrice": 45.0, "subscriptionPrice": 60.0,
        "industry": "Finance", "format": "JSON / CSV", "datasetSize": "850 MB",
        "numberOfRecords": 250000, "dataQualityScore": 97.0, "coverageScore": 92.0,
        "biasAnalysis": "No significant geo-bias detected.",
        "samplePreview": '{"records": [{"tx_id": "TX-90231", "amount": 420.50, "currency": "USD", "risk_label": "legit"}]}',
        "licenseType": "Standard Dev License", "commercialUsage": True,
        "biasRiskScore": 5.0, "startupCompatibilityScore": 95.0,
        "industryFitScore": 94.0, "commercialReadinessScore": 96.0
    },
    {
        "title": "Crop Disease Detection Images", "cat": "Agriculture", "sub": "Datasets",
        "price": 600.0, "type": "buy", "rentPrice": 60.0, "subscriptionPrice": 80.0,
        "industry": "Agriculture", "format": "JPEG / XML", "datasetSize": "2.4 GB",
        "numberOfRecords": 35000, "dataQualityScore": 89.0, "coverageScore": 85.0,
        "biasAnalysis": "Niche focus on tropical crop strains.",
        "samplePreview": '{"records": [{"img_id": "AGRI-381", "labels": ["leaf_rust"], "confidence": 1.0}]}',
        "licenseType": "Open Commercial License", "commercialUsage": True,
        "biasRiskScore": 20.0, "startupCompatibilityScore": 86.0,
        "industryFitScore": 90.0, "commercialReadinessScore": 84.0
    },
    {
        "title": "EdTech Student Engagement Logs", "cat": "Education", "sub": "Datasets",
        "price": 380.0, "type": "buy", "rentPrice": 38.0, "subscriptionPrice": 50.0,
        "industry": "Education", "format": "JSON / Parquet", "datasetSize": "620 MB",
        "numberOfRecords": 180000, "dataQualityScore": 91.0, "coverageScore": 87.0,
        "biasAnalysis": "Balanced across age groups 8-22.",
        "samplePreview": '{"records": [{"session_id": "STU-0021", "engagement_score": 0.87, "completion": true}]}',
        "licenseType": "Research & Commercial License", "commercialUsage": True,
        "biasRiskScore": 10.0, "startupCompatibilityScore": 90.0,
        "industryFitScore": 92.0, "commercialReadinessScore": 88.0
    },
    # --- ML Models ---
    {
        "title": "Lung Tumor Classification ResNet Model", "cat": "Healthcare", "sub": "ML Models",
        "price": 2800.0, "type": "buy", "framework": "PyTorch",
        "accuracy": 0.945, "precision": 0.938, "recall": 0.952, "f1Score": 0.945,
        "inferenceCost": "$0.005 per scan", "trainingDataset": "100k Anonymized ECG Scans & NIH ChestXray14",
        "supportedIndustries": ["Healthcare", "Clinical Diagnostics"],
        "documentation": "https://docs.launchhub.ai/models/resnet-lung-tumor",
        "demo": "https://demo.launchhub.ai/models/resnet-lung-tumor",
        "productionReadinessScore": 92.0, "costEfficiencyScore": 88.0,
        "scalabilityScore": 95.0, "industryCompatibilityScore": 94.0, "startupCompatibilityScore": 90.0
    },
    {
        "title": "Financial Trend Forecaster LSTM", "cat": "Finance", "sub": "ML Models",
        "price": 1900.0, "type": "buy", "framework": "TensorFlow",
        "accuracy": 0.895, "precision": 0.884, "recall": 0.902, "f1Score": 0.893,
        "inferenceCost": "$0.001 per forecast tick", "trainingDataset": "Stripe B2B Payment Log Stream & Yahoo Finance API",
        "supportedIndustries": ["Finance", "Quantitative Trading"],
        "documentation": "https://docs.launchhub.ai/models/lstm-trend-forecaster",
        "demo": "https://demo.launchhub.ai/models/lstm-trend-forecaster",
        "productionReadinessScore": 88.0, "costEfficiencyScore": 92.0,
        "scalabilityScore": 90.0, "industryCompatibilityScore": 91.0, "startupCompatibilityScore": 93.0
    },
    {
        "title": "Crop Yield Forecasting LSTM", "cat": "Agriculture", "sub": "ML Models",
        "price": 1600.0, "type": "buy", "framework": "TensorFlow",
        "accuracy": 0.872, "precision": 0.861, "recall": 0.880, "f1Score": 0.870,
        "inferenceCost": "$0.002 per prediction", "trainingDataset": "Crop Disease Detection Images & Satellite NDVI",
        "supportedIndustries": ["Agriculture", "Climate Tech"],
        "documentation": "https://docs.launchhub.ai/models/lstm-crop-yield",
        "demo": "https://demo.launchhub.ai/models/lstm-crop-yield",
        "productionReadinessScore": 85.0, "costEfficiencyScore": 90.0,
        "scalabilityScore": 88.0, "industryCompatibilityScore": 93.0, "startupCompatibilityScore": 87.0
    },
    {
        "title": "NLP Student Performance Predictor", "cat": "Education", "sub": "ML Models",
        "price": 1200.0, "type": "buy", "framework": "HuggingFace",
        "accuracy": 0.882, "precision": 0.876, "recall": 0.889, "f1Score": 0.882,
        "inferenceCost": "$0.0008 per inference", "trainingDataset": "EdTech Student Engagement Logs",
        "supportedIndustries": ["Education", "HR Tech"],
        "documentation": "https://docs.launchhub.ai/models/nlp-student-predictor",
        "demo": "https://demo.launchhub.ai/models/nlp-student-predictor",
        "productionReadinessScore": 83.0, "costEfficiencyScore": 94.0,
        "scalabilityScore": 86.0, "industryCompatibilityScore": 89.0, "startupCompatibilityScore": 91.0
    },
    # --- AI Agents ---
    {"title": "FastAPI AI Customer Support Agent", "cat": "Finance",    "sub": "AI Agents",    "price": 49.0,  "type": "monthly", "rentPrice": 49.0},
    {"title": "HR Recruiter Pipeline Agent",       "cat": "General",    "sub": "AI Agents",    "price": 79.0,  "type": "monthly", "rentPrice": 79.0},
    {"title": "Healthcare Triage Bot Agent",       "cat": "Healthcare", "sub": "AI Agents",    "price": 99.0,  "type": "monthly", "rentPrice": 99.0},
    {"title": "E-Commerce Upsell Advisor Agent",   "cat": "Ecommerce",  "sub": "AI Agents",    "price": 59.0,  "type": "monthly", "rentPrice": 59.0},
    # --- AI Workflows ---
    {"title": "Patient Onboarding Node Pipeline",  "cat": "Healthcare", "sub": "AI Workflows", "price": 250.0, "type": "buy"},
    {"title": "Invoice Auto-Processing Workflow",  "cat": "Finance",    "sub": "AI Workflows", "price": 180.0, "type": "buy"},
    {"title": "Student Enrollment Automation",     "cat": "Education",  "sub": "AI Workflows", "price": 140.0, "type": "buy"},
    # --- Prompt Libraries ---
    {"title": "Startup Yantra Prompts Deck",       "cat": "General",    "sub": "Prompt Libraries", "price": 19.0, "type": "buy"},
    {"title": "Healthcare Diagnosis Prompt Pack",  "cat": "Healthcare", "sub": "Prompt Libraries", "price": 29.0, "type": "buy"},
    {"title": "FinTech Analyst Prompt Suite",      "cat": "Finance",    "sub": "Prompt Libraries", "price": 24.0, "type": "buy"},
]
for ai in ai_assets:
    aid = f"seed-ai-{ai['title'].replace(' ', '-').lower()}"
    item = {
        "PK": f"ASSET#AI#{aid}", "SK": "METADATA",
        "GSI1PK": f"ASSETS#AI#{ai['sub']}", "GSI1SK": f"PRICE#{ai['price']}",
        "id": aid, "title": ai["title"],
        "description": ai.get("description", f"Verified {ai['sub']} ready for startup integration."),
        "category": ai["cat"], "subCategory": ai["sub"],
        "price": ai["price"], "accessType": ai["type"],
        "rentPrice": ai.get("rentPrice"),
        "subscriptionPrice": ai.get("subscriptionPrice"),
        "sellerId": "seed-seller-ai", "status": "active",
        "createdAt": now, "verificationStatus": "verified"
    }
    for field in ["industry", "format", "datasetSize", "numberOfRecords", "dataQualityScore",
                  "coverageScore", "biasAnalysis", "samplePreview", "licenseType", "commercialUsage",
                  "framework", "accuracy", "precision", "recall", "f1Score", "inferenceCost",
                  "trainingDataset", "supportedIndustries", "documentation", "demo",
                  "biasRiskScore", "startupCompatibilityScore", "industryFitScore",
                  "commercialReadinessScore", "productionReadinessScore", "costEfficiencyScore",
                  "scalabilityScore", "industryCompatibilityScore"]:
        if field in ai:
            item[field] = ai[field]
    put(item)
print(f"  ✓ {len(ai_assets)} AI assets seeded")

print("Seeding Talent / Guild Network...")
talents = [
    {"name": "Priya Sharma",   "role": "AI Engineer",    "rate": 85.0,  "skills": ["Python", "PyTorch", "LangChain", "FastAPI"],      "avail": "20 hrs/week"},
    {"name": "Aarav Patel",    "role": "Developer",       "rate": 65.0,  "skills": ["TypeScript", "Next.js", "Tailwind CSS", "React"],  "avail": "Full-time"},
    {"name": "Neha Iyer",      "role": "Designer",        "rate": 60.0,  "skills": ["Figma", "UI/UX", "Brand Design", "Framer"],       "avail": "30 hrs/week"},
    {"name": "Rohan Mehta",    "role": "AI Engineer",     "rate": 90.0,  "skills": ["TensorFlow", "CUDA", "MLOps", "AWS SageMaker"],   "avail": "Full-time"},
    {"name": "Sneha Kapoor",   "role": "Developer",       "rate": 70.0,  "skills": ["Node.js", "Go", "Kubernetes", "PostgreSQL"],      "avail": "30 hrs/week"},
    {"name": "Arjun Das",      "role": "Designer",        "rate": 55.0,  "skills": ["Webflow", "Sketch", "Motion Design", "CSS"],      "avail": "20 hrs/week"},
    {"name": "Divya Reddy",    "role": "AI Engineer",     "rate": 95.0,  "skills": ["LLMs", "RAG", "LangGraph", "Pinecone"],           "avail": "Full-time"},
    {"name": "Kiran Bose",     "role": "Developer",       "rate": 75.0,  "skills": ["React Native", "iOS", "Swift", "Firebase"],       "avail": "20 hrs/week"},
]
for t in talents:
    tid = f"seed-talent-{t['name'].replace(' ', '-').lower()}"
    put({
        "PK": f"TALENT#{tid}", "SK": "METADATA",
        "GSI1PK": f"TALENT#ROLE#{t['role']}", "GSI1SK": f"RATE#{t['rate']}",
        "userId": tid, "fullName": t["name"], "role": t["role"],
        "skills": t["skills"], "ratePerHour": t["rate"],
        "availability": t["avail"],
        "portfolio": [f"https://portfolio.launchhub.ai/{t['name'].split()[0].lower()}"],
        "rating": 4.9, "reviewsCount": 14, "trustScore": 92, "createdAt": now
    })
print(f"  ✓ {len(talents)} talent profiles seeded")

print("Seeding Investors...")
investors = [
    {"name": "Nexus Venture Partners", "org": "Nexus VC",        "focus": ["Healthcare", "Finance"],    "ticket": "$100k - $500k", "stage": ["MVP", "Growth"]},
    {"name": "Aurora Capital Group",   "org": "Aurora Fund",     "focus": ["Education", "Agriculture"], "ticket": "$50k - $150k",  "stage": ["Idea", "MVP"]},
    {"name": "Stellar Seed Angel",     "org": "Stellar Network", "focus": ["Ecommerce", "General"],     "ticket": "$10k - $50k",   "stage": ["Idea"]},
    {"name": "DeepTech Horizons Fund", "org": "DeepTech VC",     "focus": ["Healthcare", "AI"],         "ticket": "$200k - $1M",   "stage": ["Growth", "Series A"]},
    {"name": "GreenField AgriCapital", "org": "GreenField VC",   "focus": ["Agriculture", "Climate"],   "ticket": "$25k - $100k",  "stage": ["Idea", "MVP"]},
    {"name": "EdVenture Partners",     "org": "EdVenture",       "focus": ["Education", "HR Tech"],     "ticket": "$30k - $200k",  "stage": ["MVP", "Growth"]},
]
for inv in investors:
    iid = f"seed-inv-{inv['name'].replace(' ', '-').lower()}"
    put({
        "PK": f"INVESTOR#{iid}", "SK": "METADATA",
        "GSI1PK": "INVESTORS", "GSI1SK": f"NAME#{inv['name']}",
        "userId": iid, "name": inv["name"], "organization": inv["org"],
        "industryFocus": inv["focus"], "ticketSize": inv["ticket"],
        "stagePreference": inv["stage"], "createdAt": now
    })
print(f"  ✓ {len(investors)} investors seeded")

print("\n========================================================")
print("SUCCESS: All marketplace data seeded into DynamoDB!")
print("========================================================")
