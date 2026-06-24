import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from typing import Optional

# Resolve absolute path to apps/api/.env
api_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(api_dir, ".env")
load_dotenv(env_path)

class Settings(BaseSettings):
    AWS_REGION: str = "us-east-1"
    DYNAMODB_TABLE_NAME: str = "LaunchHubTable"
    COGNITO_USER_POOL_ID: Optional[str] = None
    COGNITO_APP_CLIENT_ID: Optional[str] = None
    GEMINI_API_KEY: str = ""
    MOCK_AUTH: bool = True
    PORT: int = 8000

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()

