import json
import re
import uuid
import time
from app.config import settings
from app.database import db

import google.generativeai as genai
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

class BlueprintService:
    def __init__(self):
        pass

    def _generate_with_gemini(self, idea: str) -> dict:
        prompt = f"""
        You are the Startup Blueprint Engine AI for LaunchHub AI. Your job is to generate a comprehensive, highly-realistic 8-pillar launch blueprint for a founder's startup idea.
        
        Startup Idea: "{idea}"
        
        Generate a detailed JSON object containing the blueprint. The JSON must match the following format exactly, and you should output ONLY the raw JSON without any wrapper markdown or descriptions.
        
        JSON Structure:
        {{
            "ideaSummary": "A concise summary of the idea.",
            "valueProposition": "The primary value proposition.",
            "businessModel": "How the startup will make money.",
            "targetAudience": "Description of the target market.",
            "costEstimate": 4200.0,
            "launchTimeline": "28 Days",
            "fundingPotential": "85%",
            "startupReadinessScore": 91,
            "roadmap": [
                {{"step": 1, "title": "Phase 1 Title", "description": "Phase 1 details"}},
                {{"step": 2, "title": "Phase 2 Title", "description": "Phase 2 details"}},
                {{"step": 3, "title": "Phase 3 Title", "description": "Phase 3 details"}},
                {{"step": 4, "title": "Phase 4 Title", "description": "Phase 4 details"}}
            ],
            "requiredAssets": {{
                "domains": ["suggested1.ai", "suggested2.com"],
                "websites": ["e.g. healthcare-screener-saas", "ehr-sync-portal"],
                "apps": ["e.g. mobile fitness app companion", "doctor-booking-ios"],
                "datasets": ["healthcare records", "customer feedback dataset"],
                "models": ["vision classification model", "NLP assistant model"],
                "agents": ["customer support agent", "sales outreach assistant"],
                "freelancers": ["React Developer", "AI Engineer", "Product Designer"],
                "investors": ["AgriTech Capital", "Healthcare VCs", "Seed Angels"]
            }},
            "recommendedDataset": "A specific premium dataset matching the concept",
            "recommendedModel": "A specific pre-trained model matching the concept",
            "recommendedAgent": "A specific pre-built AI agent matching the concept",
            "requiredDataAssets": ["data asset 1", "data asset 2"],
            "requiredAiAssets": ["AI asset 1", "AI asset 2"],
            "estimatedAiInfraCost": 1200.0,
            "estimatedDatasetCost": 850.0,
            "estimatedModelCost": 1900.0
        }}
        """
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(prompt)
            text = response.text
            match = re.search(r"\{.*\}", text, re.DOTALL)
            if match:
                return json.loads(match.group(0))
        except Exception as e:
            print(f"Gemini Blueprint failed, using local template: {str(e)}")
        return self._generate_fallback(idea)

    def _generate_fallback(self, idea: str) -> dict:
        # Check industry
        idea_lower = idea.lower()
        industry = "SaaS"
        category = "Finance"
        if "health" in idea_lower or "medical" in idea_lower:
            industry = "HealthTech"
            category = "Healthcare"
        elif "finance" in idea_lower or "crypto" in idea_lower or "fintech" in idea_lower:
            industry = "FinTech"
            category = "Finance"
        elif "learn" in idea_lower or "education" in idea_lower or "school" in idea_lower:
            industry = "EdTech"
            category = "Education"
        elif "farm" in idea_lower or "agri" in idea_lower:
            industry = "AgriTech"
            category = "Agriculture"
        elif "shop" in idea_lower or "store" in idea_lower or "commerce" in idea_lower:
            industry = "E-Commerce"
            category = "Ecommerce"

        # Setup standard cost estimate & metrics
        cost_est = 4200.0 if "farm" in idea_lower or "agri" in idea_lower else 6000.0
        launch_days = "28 Days" if "farm" in idea_lower or "agri" in idea_lower else "42 Days"
        funding_pot = "82%" if "farm" in idea_lower or "agri" in idea_lower else "78%"
        readiness = 91 if "farm" in idea_lower or "agri" in idea_lower else 85

        # Templates
        is_farm = "farm" in idea_lower or "agri" in idea_lower
        is_health = "health" in idea_lower or "medical" in idea_lower
        
        rec_ds = "Crop Disease Detection Images" if is_farm else ("100k Anonymized ECG Scans" if is_health else "Stripe B2B Payment Log Stream")
        rec_model = "Crop Yield Forecasting LSTM" if is_farm else ("Lung Tumor Classification ResNet Model" if is_health else "Financial Trend Forecaster LSTM")
        rec_agent = "FastAPI AI Customer Support Agent"
        
        req_data = ["Remote field moisture indicators", "Historical weather charts"] if is_farm else (["Cardiac arrhythmia recordings", "NIH chest databases"] if is_health else ["Payment transaction payloads", "Vendor risk flags"])
        req_ai = ["Soil classification weights", "Anomaly notifications trigger"] if is_farm else (["Segmentation neural nodes", "Autogenerated diagnostics script"] if is_health else ["LSTM forecaster architecture", "Real-time alerts webhook"])

        dataset_cost = 600.0 if is_farm else (950.0 if is_health else 450.0)
        model_cost = 1900.0 if is_farm else (2800.0 if is_health else 1900.0)
        infra_cost = 800.0 if is_farm else (1200.0 if is_health else 1000.0)
        
        return {
            "ideaSummary": f"An innovative {industry} solution addressing key workflow bottlenecks based on your idea.",
            "valueProposition": "Unlocking efficiency and decreasing costs through automated cloud-based workflows.",
            "businessModel": "B2B Subscription (SaaS) and transactional API usage.",
            "targetAudience": f"Small to medium businesses in the {category} sector.",
            "costEstimate": cost_est + dataset_cost + model_cost + infra_cost,
            "launchTimeline": launch_days,
            "fundingPotential": funding_pot,
            "startupReadinessScore": readiness,
            "roadmap": [
                {"step": 1, "title": "Market Fit & Domain Setup", "description": f"Secure premium {category} domains and setup brand identity."},
                {"step": 2, "title": "AI Assets & Models Assembly", "description": "Rent pre-trained AI models or source niche datasets to train specialized models."},
                {"step": 3, "title": "Guild Sourcing & MVP build", "description": "Hire front-end developers and ML engineers to build a working prototype."},
                {"step": 4, "title": "Capital Pitching & Launch", "description": "Deploy MVP, secure early users, and present traction to VC partners."}
            ],
            "requiredAssets": {
                "domains": [f"{category.lower() or 'crop'}vision.ai" if is_farm else f"get{category.lower()}hub.ai"],
                "websites": [f"Verified {category} SaaS template storefront"],
                "apps": [f"Production-grade {category} mobile helper app"],
                "datasets": [rec_ds],
                "models": [rec_model],
                "agents": [rec_agent],
                "freelancers": ["AI/ML Engineer", "Fullstack Developer", "UX Designer"],
                "investors": ["AgriTech Capital" if is_farm else f"Stellar {category} VCs"]
            },
            "recommendedDataset": rec_ds,
            "recommendedModel": rec_model,
            "recommendedAgent": rec_agent,
            "requiredDataAssets": req_data,
            "requiredAiAssets": req_ai,
            "estimatedAiInfraCost": infra_cost,
            "estimatedDatasetCost": dataset_cost,
            "estimatedModelCost": model_cost
        }

    def generate(self, idea: str) -> dict:
        if settings.GEMINI_API_KEY:
            return self._generate_with_gemini(idea)
        else:
            return self._generate_fallback(idea)

blueprint_service = BlueprintService()
