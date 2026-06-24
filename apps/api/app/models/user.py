import re
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import List, Optional, Literal

VALID_ROLES = {"founder", "investor", "seller", "agency", "freelancer"}

class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=30)
    fullName: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=8, max_length=128)
    role: Optional[str] = "founder"

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^[a-zA-Z0-9_]+$", v):
            raise ValueError("Username can only contain letters, numbers, and underscores")
        if v.startswith("_"):
            raise ValueError("Username cannot start with an underscore")
        if len(v) < 3:
            raise ValueError("Username must be at least 3 characters")
        return v

    @field_validator("fullName")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^[a-zA-Z\s\-'.]+$", v):
            raise ValueError("Full name can only contain letters, spaces, hyphens, and apostrophes")
        if len(v) < 2:
            raise ValueError("Full name must be at least 2 characters")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>\-_=+\[\]\\;'/~`]", v):
            raise ValueError("Password must contain at least one special character")
        return v

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: Optional[str]) -> str:
        if v is None:
            return "founder"
        v = v.strip().lower()
        if v not in VALID_ROLES:
            raise ValueError(f"Role must be one of: {', '.join(sorted(VALID_ROLES))}")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)

    @field_validator("password")
    @classmethod
    def validate_password_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Password is required")
        return v


class UserProfileUpdate(BaseModel):
    fullName: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    portfolio: Optional[List[str]] = None
    avatarUrl: Optional[str] = None

    @field_validator("fullName")
    @classmethod
    def validate_full_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if not re.match(r"^[a-zA-Z\s\-'.]+$", v):
            raise ValueError("Full name can only contain letters, spaces, hyphens, and apostrophes")
        if len(v) < 2:
            raise ValueError("Full name must be at least 2 characters")
        return v


class UserProfileResponse(BaseModel):
    id: str
    email: EmailStr
    username: str
    fullName: str
    role: str
    verificationLevel: int
    trustScore: int
    bio: Optional[str] = ""
    skills: List[str] = []
    portfolio: List[str] = []
    avatarUrl: Optional[str] = ""
    createdAt: int
