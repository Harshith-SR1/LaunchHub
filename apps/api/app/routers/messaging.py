import time
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from app.database import db
from app.auth import get_current_user
from app.models.chat import SendMessageRequest, MessageResponse, ConversationResponse

router = APIRouter(prefix="/messages", tags=["Messaging System"])

def get_conversation_id(user_a: str, user_b: str) -> str:
    # Deterministic conversation ID for any 2 users
    first = min(user_a, user_b)
    second = max(user_a, user_b)
    return f"CONV#{first}_{second}"

@router.post("", response_model=MessageResponse)
def send_message(body: SendMessageRequest, user: dict = Depends(get_current_user)):
    sender_id = user["id"]
    receiver_id = body.receiverId
    
    if sender_id == receiver_id:
        raise HTTPException(status_code=400, detail="Cannot send message to yourself")
        
    conv_id = get_conversation_id(sender_id, receiver_id)
    msg_id = str(uuid.uuid4())
    timestamp = int(time.time() * 1000) # millisecond timestamp
    
    # 1. Store Message item
    msg_item = {
        "PK": f"CHAT#{conv_id}",
        "SK": f"MSG#{timestamp}#{msg_id}",
        "id": msg_id,
        "conversationId": conv_id,
        "senderId": sender_id,
        "receiverId": receiver_id,
        "body": body.body,
        "fileUrls": body.fileUrls or [],
        "timestamp": timestamp
    }
    db.put_item(msg_item)
    
    # 2. Store/Update Conversation index records for BOTH users
    # For sender
    db.put_item({
        "PK": f"USER#{sender_id}#CONVERSATIONS",
        "SK": f"CONV#{conv_id}",
        "id": conv_id,
        "participants": [sender_id, receiver_id],
        "lastMessage": body.body,
        "lastTimestamp": timestamp
    })
    # For receiver
    db.put_item({
        "PK": f"USER#{receiver_id}#CONVERSATIONS",
        "SK": f"CONV#{conv_id}",
        "id": conv_id,
        "participants": [sender_id, receiver_id],
        "lastMessage": body.body,
        "lastTimestamp": timestamp
    })
    
    return msg_item

@router.get("/conversations", response_model=List[ConversationResponse])
def list_conversations(user: dict = Depends(get_current_user)):
    pk = f"USER#{user['id']}#CONVERSATIONS"
    res = db.query(
        KeyConditionExpression="PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues={":pk": pk, ":sk": "CONV#"}
    )
    # Sort conversations by last message timestamp desc
    convs = res.get("Items", [])
    convs.sort(key=lambda x: x.get("lastTimestamp", 0), reverse=True)
    return convs

@router.get("/conversations/{convId}/messages", response_model=List[MessageResponse])
def get_messages(convId: str, user: dict = Depends(get_current_user)):
    # Verify user is participant in conversation
    if user["id"] not in convId:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to conversation denied"
        )
        
    pk = f"CHAT#{convId}"
    res = db.query(
        KeyConditionExpression="PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues={":pk": pk, ":sk": "MSG#"}
    )
    messages = res.get("Items", [])
    # Sort ascending for chronological chat thread
    messages.sort(key=lambda x: x.get("timestamp", 0))
    return messages
