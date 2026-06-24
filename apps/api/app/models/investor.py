from pydantic import BaseModel
from typing import List, Optional

class InvestorProfileCreate(BaseModel):
    name: str
    organization: str
    industryFocus: List[str]
    ticketSize: str # e.g. "$10k - $50k", "$100k - $500k", etc.
    stagePreference: List[str] # Idea, MVP, Growth

class InvestorProfileResponse(BaseModel):
    userId: str
    name: str
    organization: str
    industryFocus: List[str]
    ticketSize: str
    stagePreference: List[str]
    createdAt: int

class ExpressInterestRequest(BaseModel):
    startupId: str
    message: str
    proposedTerms: Optional[str] = ""
