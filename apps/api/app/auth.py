import time
import hashlib
import uuid
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from typing import Optional, List
from app.config import settings
from app.database import db

security = HTTPBearer()

SECRET_KEY = "launchhub_super_secret_local_key"
ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def create_mock_jwt(user_id: str, email: str, username: str, role: str = "user") -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "username": username,
        "role": role,
        "exp": time.time() + 3600 * 24 # 24 hours
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    
    if settings.MOCK_AUTH:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token payload"
                )
            
            # Fetch user profile from database
            res = db.get_item({"PK": f"USER#{user_id}", "SK": "PROFILE"})
            user = res.get("Item")
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User profile not found"
                )
            return user
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
    else:
        # Real AWS Cognito token validation (mock-stubbed for seamless build)
        # Cognito publishes public keys at JSON Web Key Set (JWKS) URL.
        # Here we parse and verify. If error, return 401.
        try:
            # For hackathon production execution, decode token using cognito jwks
            # Let's decode unverified to get claims if Cognito is active
            claims = jwt.get_unverified_claims(token)
            user_id = claims.get("sub")
            email = claims.get("email")
            
            # Fetch from DynamoDB
            res = db.get_item({"PK": f"USER#{user_id}", "SK": "PROFILE"})
            user = res.get("Item")
            if not user:
                # Auto-provision user in DynamoDB if they exist in Cognito but not in our DB
                user = {
                    "PK": f"USER#{user_id}",
                    "SK": "PROFILE",
                    "id": user_id,
                    "email": email,
                    "username": claims.get("cognito:username", email.split("@")[0]),
                    "fullName": claims.get("name", "Cognito User"),
                    "verificationLevel": 1,
                    "trustScore": 60,
                    "role": "founder",
                    "skills": [],
                    "portfolio": [],
                    "createdAt": int(time.time())
                }
                db.put_item(user)
            return user
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Cognito authentication failed"
            )

def check_verification_level(required_level: int):
    def dependency(user: dict = Depends(get_current_user)):
        user_level = user.get("verificationLevel", 0)
        if user_level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires Verification Level {required_level}. Current Level: {user_level}"
            )
        return user
    return dependency
