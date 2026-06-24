from pydantic import BaseModel
from typing import List, Optional

class StartupHubCreate(BaseModel):
    name: str
    problem: str
    solution: str
    market: str
    vision: str
    fundingNeeded: float
    teamRequirements: List[str]
    stage: str # Idea, MVP, Early Revenue, Growth

class StartupHubResponse(BaseModel):
    id: str
    name: str
    problem: str
    solution: str
    market: str
    vision: str
    fundingNeeded: float
    teamRequirements: List[str]
    stage: str
    founderId: str
    likes: int
    saves: int
    follows: int
    createdAt: int

class ApplyJoinRequest(BaseModel):
    roleInterested: str
    coverLetter: str
    portfolioLinks: List[str]

class CoFounderProfileCreate(BaseModel):
    skills: List[str]
    industryExperience: List[str]
    preferredRoles: List[str]
    desiredCoFounderSkills: List[str]
    commitmentLevel: str # Part-time, Full-time, Side project
    location: str

class CoFounderProfileResponse(BaseModel):
    userId: str
    skills: List[str]
    industryExperience: List[str]
    preferredRoles: List[str]
    desiredCoFounderSkills: List[str]
    commitmentLevel: str
    location: str
    createdAt: int
