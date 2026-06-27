import json
import re
import uuid
import time
from decimal import Decimal
from app.config import settings
from app.database import db

# Initialize GenAI if key is present
import google.generativeai as genai
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

def _to_float(value, default=0.0) -> float:
    """Safely convert DynamoDB Decimal or any numeric type to float."""
    if value is None:
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default

class VentureNavigatorService:
    def __init__(self):
        pass

    def _parse_query_with_gemini(self, query: str) -> dict:
        prompt = f"""
        You are the Venture Navigator AI parser for LaunchHub AI. Your job is to extract structured filters from the user's natural language request to help search a database of startup assets.
        
        User Request: "{query}"
        
        Analyze the request and return a JSON object with the following fields. Do not include any markdown formatting or explanation outside the JSON.
        
        JSON Fields:
        - intent: A short string summarizing the user's core intent (e.g., "Build Fintech App", "Acquire Health Domain")
        - category: The core industry category (e.g., "Healthcare", "Finance", "Education", "Agriculture", "Ecommerce", "Retail", "General")
        - max_price: The maximum price the user is willing to pay (float or null)
        - asset_types: A list of asset types requested (can include: "domain", "website", "app", "dataset", "model", "agent", "talent", "investor")
        - talent_roles: A list of freelancer/agency roles requested (e.g., ["Developer", "Designer", "AI Engineer"])
        - estimated_weeks: Your expert estimate of how many weeks it takes to launch based on their request (int)
        - readiness_boost: A number between 5 and 30 representing how prepared their idea seems (int)
        
        Example Output:
        {{
            "intent": "Start AI Healthcare App",
            "category": "Healthcare",
            "max_price": 5000.0,
            "asset_types": ["domain", "dataset", "talent"],
            "talent_roles": ["AI Engineer", "Developer"],
            "estimated_weeks": 6,
            "readiness_boost": 20
        }}
        """
        try:
            model = genai.GenerativeModel("gemini-2.0-flash")
            response = model.generate_content(prompt)
            # Find JSON block
            text = response.text
            match = re.search(r"\{.*\}", text, re.DOTALL)
            if match:
                return json.loads(match.group(0))
        except Exception as e:
            print(f"Gemini parsing failed, using rule-based fallback: {str(e)}")
        return self._parse_query_fallback(query)

    def _parse_query_fallback(self, query: str) -> dict:
        query_lower = query.lower()
        
        # Intent detection
        intent = "Startup Discovery"
        if "start" in query_lower or "build" in query_lower:
            intent = f"Launch {query.split()[-1].title()} Startup"
        elif "find" in query_lower or "search" in query_lower:
            intent = "Asset Discovery"
            
        # Category matching
        category = "General"
        for cat in ["healthcare", "medical", "health"]:
            if cat in query_lower:
                category = "Healthcare"
        for cat in ["fintech", "finance", "banking", "money"]:
            if cat in query_lower:
                category = "Finance"
        for cat in ["education", "learn", "school", "edtech"]:
            if cat in query_lower:
                category = "Education"
        for cat in ["agriculture", "farm", "crop", "agtech"]:
            if cat in query_lower:
                category = "Agriculture"
        for cat in ["ecommerce", "retail", "shop", "sales"]:
            if cat in query_lower:
                category = "Ecommerce"

        # Price matching (e.g. "under $1000" or "below 500")
        max_price = None
        price_match = re.search(r"(?:under|below|max)\s*\$?\s*(\d+)", query_lower)
        if price_match:
            max_price = float(price_match.group(1))

        # Asset types requested
        asset_types = []
        if "domain" in query_lower:
            asset_types.append("domain")
        if "website" in query_lower or "saas" in query_lower:
            asset_types.append("website")
        if "app" in query_lower:
            asset_types.append("app")
        if "dataset" in query_lower or "data" in query_lower:
            asset_types.append("dataset")
        if "model" in query_lower or "ml" in query_lower:
            asset_types.append("model")
        if "agent" in query_lower or "support" in query_lower:
            asset_types.append("agent")
        if "developer" in query_lower or "designer" in query_lower or "engineer" in query_lower or "hire" in query_lower:
            asset_types.append("talent")
        if "investor" in query_lower or "fund" in query_lower:
            asset_types.append("investor")

        # If none matched, suggest reasonable defaults
        if not asset_types:
            asset_types = ["domain", "website", "agent", "talent"]

        # Talent roles
        talent_roles = []
        if "developer" in query_lower or "react" in query_lower:
            talent_roles.append("Developer")
        if "designer" in query_lower or "ui" in query_lower:
            talent_roles.append("Designer")
        if "ai" in query_lower or "ml" in query_lower:
            talent_roles.append("AI Engineer")

        # Estimates
        estimated_weeks = 4
        if "complex" in query_lower or "large" in query_lower:
            estimated_weeks = 12
        elif "simple" in query_lower or "quick" in query_lower:
            estimated_weeks = 2

        return {
            "intent": intent,
            "category": category,
            "max_price": max_price,
            "asset_types": asset_types,
            "talent_roles": talent_roles,
            "estimated_weeks": estimated_weeks,
            "readiness_boost": 15
        }

    def navigate(self, query: str) -> dict:
        # 1. Parse prompt
        if settings.GEMINI_API_KEY:
            filters = self._parse_query_with_gemini(query)
        else:
            filters = self._parse_query_fallback(query)

        category = filters.get("category", "General")
        max_price = filters.get("max_price")
        asset_types = filters.get("asset_types", [])
        talent_roles = filters.get("talent_roles", [])
        
        # Ensure Datasets and ML Models are mandatory recommendation categories
        if "dataset" not in asset_types:
            asset_types.append("dataset")
        if "model" not in asset_types:
            asset_types.append("model")

        # 2. Query DynamoDB/Mock for matches
        # Load all database items for matching
        all_items = db.scan().get("Items", [])

        recommended_domains = []
        recommended_websites = []
        recommended_apps = []
        recommended_datasets = []
        recommended_models = []
        recommended_agents = []
        recommended_talent = []
        recommended_investors = []

        total_cost = 0.0

        for item in all_items:
            sk = item.get("SK", "")
            pk = item.get("PK", "")
            
            # Check domains
            if pk.startswith("ASSET#DOMAIN#") and "domain" in asset_types:
                if item.get("category") == category or category == "General":
                    price = _to_float(item.get("price", 0.0))
                    if max_price is None or price <= max_price:
                        recommended_domains.append(item)
                        total_cost += price
                        
            # Check websites/saas
            elif pk.startswith("ASSET#WEBSITE#") and "website" in asset_types:
                if item.get("category") == category or category == "General":
                    price = _to_float(item.get("askingPrice", item.get("price", 0.0)))
                    if max_price is None or price <= max_price:
                        recommended_websites.append(item)
                        total_cost += price
                        
            # Check apps
            elif pk.startswith("ASSET#APP#") and "app" in asset_types:
                if item.get("category") == category or category == "General":
                    price = _to_float(item.get("price", 0.0))
                    if max_price is None or price <= max_price:
                        recommended_apps.append(item)
                        total_cost += price

            # Check AI assets
            elif pk.startswith("ASSET#AI#"):
                sub_cat = item.get("subCategory", "").lower()
                price = _to_float(item.get("price", 0.0))
                if max_price is None or price <= max_price:
                    if "dataset" in sub_cat and "dataset" in asset_types:
                        recommended_datasets.append(item)
                        total_cost += price
                    elif "model" in sub_cat and "model" in asset_types:
                        recommended_models.append(item)
                        total_cost += price
                    elif "agent" in sub_cat and "agent" in asset_types:
                        recommended_agents.append(item)
                        total_cost += price

            # Check talent
            elif pk.startswith("TALENT#") and "talent" in asset_types:
                role = item.get("role", "")
                if not talent_roles or role in talent_roles:
                    recommended_talent.append(item)
                    # Add 20 hours of rate to cost estimate
                    total_cost += _to_float(item.get("ratePerHour", 50.0)) * 20

            # Check investors
            elif pk.startswith("INVESTOR#") and "investor" in asset_types:
                focus = item.get("industryFocus", [])
                if category == "General" or category in focus:
                    recommended_investors.append(item)

        # 3. Create mock items if database matches are scarce
        if not recommended_domains and "domain" in asset_types:
            domain_name = f"{category.lower() or 'launch'}hub.ai"
            recommended_domains.append({
                "id": str(uuid.uuid4()),
                "name": domain_name,
                "extension": ".ai",
                "category": category,
                "price": 299.0,
                "leasePrice": 25.0,
                "traffic": 450,
                "age": 1,
                "description": f"Premium name for your new {category} startup.",
                "verificationStatus": "verified",
                "status": "active",
                "valuationScore": 84.0,
                "fitScore": 90.0,
                "demandScore": 76.0,
                "industryFitAnalysis": f"Optimal fit for brand recall in the modern {category} space."
            })
            total_cost += 299.0

        if not recommended_datasets and "dataset" in asset_types:
            is_healthcare = category == "Healthcare"
            recommended_datasets.append({
                "id": str(uuid.uuid4()),
                "title": "100k Anonymized ECG Scans" if is_healthcare else f"{category} Client Behavior Logs",
                "description": f"Anonymized training dataset containing validated parameters for {category} workflows.",
                "category": category,
                "subCategory": "Datasets",
                "price": 950.0 if is_healthcare else 450.0,
                "accessType": "buy",
                "rentPrice": 95.0 if is_healthcare else 45.0,
                "subscriptionPrice": 120.0 if is_healthcare else 60.0,
                "industry": category,
                "format": "DICOM/JSON" if is_healthcare else "JSON/CSV",
                "datasetSize": "1.2 GB" if is_healthcare else "850 MB",
                "numberOfRecords": 100000 if is_healthcare else 250000,
                "dataQualityScore": 94.0 if is_healthcare else 97.0,
                "coverageScore": 88.0 if is_healthcare else 92.0,
                "biasAnalysis": "Minimal skew. Balanced by synthetic augmentation.",
                "licenseType": "Commercial Use License",
                "commercialUsage": True,
                "biasRiskScore": 15.0 if is_healthcare else 5.0,
                "startupCompatibilityScore": 92.0 if is_healthcare else 95.0,
                "industryFitScore": 95.0 if is_healthcare else 94.0,
                "commercialReadinessScore": 90.0 if is_healthcare else 96.0,
                "verificationStatus": "verified",
                "status": "active"
            })
            total_cost += 950.0 if is_healthcare else 450.0

        if not recommended_models and "model" in asset_types:
            is_healthcare = category == "Healthcare"
            recommended_models.append({
                "id": str(uuid.uuid4()),
                "title": "Lung Tumor Classification ResNet Model" if is_healthcare else f"{category} Trend Prediction Forecasting Model",
                "description": f"Pre-trained deep learning classifier optimized for {category} inference workloads.",
                "category": category,
                "subCategory": "ML Models",
                "price": 2800.0 if is_healthcare else 1900.0,
                "accessType": "buy",
                "framework": "PyTorch" if is_healthcare else "TensorFlow",
                "accuracy": 0.945 if is_healthcare else 0.895,
                "precision": 0.938 if is_healthcare else 0.884,
                "recall": 0.952 if is_healthcare else 0.902,
                "f1Score": 0.945 if is_healthcare else 0.893,
                "inferenceCost": "$0.005 per request" if is_healthcare else "$0.001 per request",
                "trainingDataset": "Domain Specific Corpus",
                "supportedIndustries": [category],
                "documentation": "Fully documented parameters and inference API.",
                "demo": "https://models.launchhub.ai/demo",
                "productionReadinessScore": 92.0 if is_healthcare else 88.0,
                "costEfficiencyScore": 88.0 if is_healthcare else 92.0,
                "scalabilityScore": 95.0 if is_healthcare else 90.0,
                "industryCompatibilityScore": 94.0 if is_healthcare else 91.0,
                "startupCompatibilityScore": 90.0 if is_healthcare else 93.0,
                "verificationStatus": "verified",
                "status": "active"
            })
            total_cost += 2800.0 if is_healthcare else 1900.0

        if not recommended_agents and "agent" in asset_types:
            recommended_agents.append({
                "id": str(uuid.uuid4()),
                "title": f"{category} Customer Support Bot",
                "description": f"Fully autonomous AI Agent trained on {category} FAQs.",
                "category": category,
                "subCategory": "AI Agent",
                "price": 49.0,
                "accessType": "monthly",
                "rentPrice": 49.0,
                "status": "active"
            })
            total_cost += 49.0

        if not recommended_talent and "talent" in asset_types:
            role = talent_roles[0] if talent_roles else "AI Engineer"
            recommended_talent.append({
                "userId": str(uuid.uuid4()),
                "fullName": f"Alex Rivers ({role})",
                "role": role,
                "skills": ["Python", "FastAPI", "React", "LLMs"],
                "ratePerHour": 75.0,
                "availability": "20 hrs/week",
                "trustScore": 95
            })
            total_cost += 75.0 * 20

        # Estimated cost rounding
        total_cost = round(total_cost, 2)
        if total_cost == 0.0:
            total_cost = 500.0 # baseline setup cost

        # Readiness Score Calculation
        readiness_score = 40 + filters.get("readiness_boost", 15)
        # Factor in matching assets
        readiness_score += min(len(recommended_domains) * 5 + len(recommended_agents) * 5 + len(recommended_talent) * 5, 30)
        readiness_score = min(readiness_score, 100)

        # Cost and timeline description
        weeks = filters.get("estimated_weeks", 4)
        launch_time = f"{weeks} Weeks"

        return {
            "intentDetected": filters.get("intent", "Startup Discovery"),
            "estimatedCost": total_cost,
            "estimatedLaunchTime": launch_time,
            "startupReadinessScore": readiness_score,
            "recommendedAssets": {
                "domains": recommended_domains,
                "websites": recommended_websites,
                "apps": recommended_apps,
                "datasets": recommended_datasets,
                "models": recommended_models,
                "agents": recommended_agents,
                "freelancers": recommended_talent,
                "investors": recommended_investors
            }
        }

navigator_service = VentureNavigatorService()
