from pydantic import BaseModel
from typing import List, Optional

class SendMessageRequest(BaseModel):
    receiverId: str
    body: str
    fileUrls: Optional[List[str]] = []

class MessageResponse(BaseModel):
    id: str
    conversationId: str
    senderId: str
    receiverId: str
    body: str
    fileUrls: List[str]
    timestamp: int

class ConversationResponse(BaseModel):
    id: str
    participants: List[str]
    lastMessage: Optional[str] = ""
    lastTimestamp: int
