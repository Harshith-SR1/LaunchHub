import time
import uuid
from fastapi import APIRouter, HTTPException, Depends, status
from app.database import db
from app.auth import hash_password, verify_password, create_mock_jwt, get_current_user
from app.models.user import UserRegister, UserLogin, UserProfileUpdate, UserProfileResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserProfileResponse)
def register(body: UserRegister):
    # Check if email exists
    email_key = f"USER#EMAIL#{body.email.lower()}"
    res = db.query(
        KeyConditionExpression="GSI1PK = :pk AND GSI1SK = :sk",
        ExpressionAttributeValues={":pk": email_key, ":sk": "PROFILE"},
        IndexName="GSI1"
    )
    if res.get("Items"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username exists
    username_res = db.scan(
        FilterExpression="username = :uname",
        ExpressionAttributeValues={":uname": body.username}
    )
    if username_res.get("Items"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    user_id = str(uuid.uuid4())
    hashed = hash_password(body.password)
    
    user_item = {
        "PK": f"USER#{user_id}",
        "SK": "PROFILE",
        "GSI1PK": email_key,
        "GSI1SK": "PROFILE",
        "id": user_id,
        "email": body.email.lower(),
        "username": body.username,
        "fullName": body.fullName,
        "passwordHash": hashed,
        "role": body.role,
        "verificationLevel": 0,
        "trustScore": 50,
        "bio": "",
        "skills": [],
        "portfolio": [],
        "avatarUrl": "",
        "createdAt": int(time.time())
    }
    
    db.put_item(user_item)
    return user_item

@router.post("/login")
def login(body: UserLogin):
    email_key = f"USER#EMAIL#{body.email.lower()}"
    res = db.query(
        KeyConditionExpression="GSI1PK = :pk AND GSI1SK = :sk",
        ExpressionAttributeValues={":pk": email_key, ":sk": "PROFILE"},
        IndexName="GSI1"
    )
    items = res.get("Items", [])
    if not items:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    user = items[0]
    if not verify_password(body.password, user.get("passwordHash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Generate JWT
    token = create_mock_jwt(
        user_id=user["id"],
        email=user["email"],
        username=user["username"],
        role=user["role"]
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "username": user["username"],
            "fullName": user["fullName"],
            "role": user["role"],
            "verificationLevel": user["verificationLevel"],
            "trustScore": user["trustScore"]
        }
    }

@router.get("/me", response_model=UserProfileResponse)
def get_me(user: dict = Depends(get_current_user)):
    return user

@router.patch("/me", response_model=UserProfileResponse)
def update_profile(body: UserProfileUpdate, user: dict = Depends(get_current_user)):
    pk = user["PK"]
    sk = user["SK"]
    
    # Build update expressions
    update_expr = []
    expr_values = {}
    expr_names = {}
    
    if body.fullName is not None:
        update_expr.append("#fn = :fn")
        expr_values[":fn"] = body.fullName
        expr_names["#fn"] = "fullName"
        user["fullName"] = body.fullName
        
    if body.bio is not None:
        update_expr.append("#bio = :bio")
        expr_values[":bio"] = body.bio
        expr_names["#bio"] = "bio"
        user["bio"] = body.bio
        
    if body.skills is not None:
        update_expr.append("#sk = :sk")
        expr_values[":sk"] = body.skills
        expr_names["#sk"] = "skills"
        user["skills"] = body.skills
        
    if body.portfolio is not None:
        update_expr.append("#port = :port")
        expr_values[":port"] = body.portfolio
        expr_names["#port"] = "portfolio"
        user["portfolio"] = body.portfolio
        
    if body.avatarUrl is not None:
        update_expr.append("#av = :av")
        expr_values[":av"] = body.avatarUrl
        expr_names["#av"] = "avatarUrl"
        user["avatarUrl"] = body.avatarUrl

    if not update_expr:
        return user
        
    expr_str = "SET " + ", ".join(update_expr)
    db.update_item(
        Key={"PK": pk, "SK": sk},
        UpdateExpression=expr_str,
        ExpressionAttributeValues=expr_values,
        ExpressionAttributeNames=expr_names
    )
    
    return user
