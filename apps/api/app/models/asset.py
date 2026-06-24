from pydantic import BaseModel, Field
from typing import List, Optional

class AssetBase(BaseModel):
    title: str
    description: str
    category: str
    price: float
    status: Optional[str] = "active"

# MODULE 1: Domain
class DomainCreate(BaseModel):
    name: str
    extension: str
    category: str
    price: float
    leasePrice: Optional[float] = None
    traffic: Optional[int] = 0
    age: Optional[int] = 0
    description: str
    valuationScore: Optional[float] = None
    fitScore: Optional[float] = None
    demandScore: Optional[float] = None
    industryFitAnalysis: Optional[str] = None

class DomainResponse(BaseModel):
    id: str
    name: str
    extension: str
    category: str
    price: float
    leasePrice: Optional[float] = None
    traffic: int
    age: int
    description: str
    sellerId: str
    verificationStatus: str
    status: str
    createdAt: int
    valuationScore: Optional[float] = None
    fitScore: Optional[float] = None
    demandScore: Optional[float] = None
    industryFitAnalysis: Optional[str] = None

# MODULE 2: Website / SaaS
class WebsiteCreate(BaseModel):
    title: str
    category: str
    description: str
    revenue: float
    users: int
    mrr: float
    arr: float
    traffic: int
    stack: List[str]
    demoUrl: Optional[str] = None
    askingPrice: float
    healthScore: Optional[float] = None
    riskScore: Optional[float] = None
    growthPotentialScore: Optional[float] = None
    growthTrend: Optional[str] = None

class WebsiteResponse(BaseModel):
    id: str
    title: str
    category: str
    description: str
    revenue: float
    users: int
    mrr: float
    arr: float
    traffic: int
    stack: List[str]
    demoUrl: Optional[str] = None
    askingPrice: float
    sellerId: str
    status: str
    createdAt: int
    healthScore: Optional[float] = None
    riskScore: Optional[float] = None
    growthPotentialScore: Optional[float] = None
    growthTrend: Optional[str] = None

# MODULE 3: App Listing
class AppCreate(BaseModel):
    title: str
    category: str
    description: str
    downloads: int
    revenue: float
    platform: str # iOS, Android, Web
    price: float

class AppResponse(BaseModel):
    id: str
    title: str
    category: str
    description: str
    downloads: int
    revenue: float
    platform: str
    price: float
    sellerId: str
    status: str
    createdAt: int

# MODULE 4: AI Asset Listing
class AIAssetCreate(BaseModel):
    title: str
    description: str
    category: str # Healthcare, Finance, NLP, etc.
    subCategory: str # Datasets, ML Models, AI Agents, AI Workflows, Prompt Libraries
    price: float
    accessType: str # buy, rent, monthly, annual, lifetime
    rentPrice: Optional[float] = None
    subscriptionPrice: Optional[float] = None
    
    # Dataset specific
    industry: Optional[str] = None
    format: Optional[str] = None
    datasetSize: Optional[str] = None
    numberOfRecords: Optional[int] = None
    dataQualityScore: Optional[float] = None
    coverageScore: Optional[float] = None
    biasAnalysis: Optional[str] = None
    samplePreview: Optional[str] = None
    licenseType: Optional[str] = None
    commercialUsage: Optional[bool] = True

    # ML Model specific
    framework: Optional[str] = None
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1Score: Optional[float] = None
    inferenceCost: Optional[str] = None
    trainingDataset: Optional[str] = None
    supportedIndustries: Optional[List[str]] = None
    documentation: Optional[str] = None
    demo: Optional[str] = None
    
    # AI Intelligence scores
    biasRiskScore: Optional[float] = None
    startupCompatibilityScore: Optional[float] = None
    industryFitScore: Optional[float] = None
    commercialReadinessScore: Optional[float] = None
    productionReadinessScore: Optional[float] = None
    costEfficiencyScore: Optional[float] = None
    scalabilityScore: Optional[float] = None
    industryCompatibilityScore: Optional[float] = None

class AIAssetResponse(BaseModel):
    id: str
    title: str
    description: str
    category: str
    subCategory: str
    price: float
    accessType: str
    rentPrice: Optional[float] = None
    subscriptionPrice: Optional[float] = None
    sellerId: str
    status: str
    createdAt: int
    verificationStatus: Optional[str] = "verified"
    
    # Dataset specific
    industry: Optional[str] = None
    format: Optional[str] = None
    datasetSize: Optional[str] = None
    numberOfRecords: Optional[int] = None
    dataQualityScore: Optional[float] = None
    coverageScore: Optional[float] = None
    biasAnalysis: Optional[str] = None
    samplePreview: Optional[str] = None
    licenseType: Optional[str] = None
    commercialUsage: Optional[bool] = True

    # ML Model specific
    framework: Optional[str] = None
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1Score: Optional[float] = None
    inferenceCost: Optional[str] = None
    trainingDataset: Optional[str] = None
    supportedIndustries: Optional[List[str]] = None
    documentation: Optional[str] = None
    demo: Optional[str] = None
    
    # AI Intelligence scores
    biasRiskScore: Optional[float] = None
    startupCompatibilityScore: Optional[float] = None
    industryFitScore: Optional[float] = None
    commercialReadinessScore: Optional[float] = None
    productionReadinessScore: Optional[float] = None
    costEfficiencyScore: Optional[float] = None
    scalabilityScore: Optional[float] = None
    industryCompatibilityScore: Optional[float] = None

