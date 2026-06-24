import os
import sys
import time
import boto3
from botocore.exceptions import ClientError

# Add current directory to path so we can import app config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def load_env_file(filepath):
    env_vars = {}
    if os.path.exists(filepath):
        with open(filepath, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env_vars[k.strip()] = v.strip()
    return env_vars

def write_env_file(filepath, updates):
    lines = []
    if os.path.exists(filepath):
        with open(filepath, "r") as f:
            lines = f.readlines()
            
    new_lines = []
    keys_updated = set()
    
    for line in lines:
        stripped = line.strip()
        if stripped and not stripped.startswith("#") and "=" in stripped:
            k, v = stripped.split("=", 1)
            k = k.strip()
            if k in updates:
                new_lines.append(f"{k}={updates[k]}\n")
                keys_updated.add(k)
                continue
        new_lines.append(line)
        
    for k, v in updates.items():
        if k not in keys_updated:
            new_lines.append(f"{k}={v}\n")
            
    with open(filepath, "w") as f:
        f.writelines(new_lines)

def main():
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    env = load_env_file(env_path)
    
    aws_key = env.get("AWS_ACCESS_KEY_ID")
    aws_secret = env.get("AWS_SECRET_ACCESS_KEY")
    aws_region = env.get("AWS_REGION", "us-east-1")
    table_name = env.get("DYNAMODB_TABLE_NAME", "LaunchHubTable")
    
    if not aws_key or not aws_secret:
        print("ERROR: Please fill in AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in apps/api/.env first!")
        sys.exit(1)
        
    print(f"Initializing AWS resources in region: {aws_region}...")
    
    # 1. Initialize Clients
    dynamodb = boto3.client(
        "dynamodb",
        region_name=aws_region,
        aws_access_key_id=aws_key,
        aws_secret_access_key=aws_secret
    )
    
    cognito = boto3.client(
        "cognito-idp",
        region_name=aws_region,
        aws_access_key_id=aws_key,
        aws_secret_access_key=aws_secret
    )
    
    # 2. Setup DynamoDB Table
    print(f"\nChecking DynamoDB table '{table_name}'...")
    try:
        dynamodb.describe_table(TableName=table_name)
        print(f"Table '{table_name}' already exists.")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            print(f"Table '{table_name}' not found. Creating table...")
            try:
                dynamodb.create_table(
                    TableName=table_name,
                    KeySchema=[
                        {"AttributeName": "PK", "KeyType": "HASH"},
                        {"AttributeName": "SK", "KeyType": "RANGE"}
                    ],
                    AttributeDefinitions=[
                        {"AttributeName": "PK", "AttributeType": "S"},
                        {"AttributeName": "SK", "AttributeType": "S"},
                        {"AttributeName": "GSI1PK", "AttributeType": "S"},
                        {"AttributeName": "GSI1SK", "AttributeType": "S"}
                    ],
                    GlobalSecondaryIndexes=[
                        {
                            "IndexName": "GSI1",
                            "KeySchema": [
                                {"AttributeName": "GSI1PK", "KeyType": "HASH"},
                                {"AttributeName": "GSI1SK", "KeyType": "RANGE"}
                            ],
                            "Projection": {"ProjectionType": "ALL"}
                        }
                    ],
                    BillingMode="PAY_PER_REQUEST"
                )
                print(f"Table creation initiated. Waiting for active status...")
                waiter = dynamodb.get_waiter("table_exists")
                waiter.wait(TableName=table_name)
                print(f"Table '{table_name}' is now active!")
            except Exception as create_err:
                print(f"Failed to create DynamoDB table: {str(create_err)}")
                sys.exit(1)
        else:
            print(f"Error checking DynamoDB table: {str(e)}")
            sys.exit(1)
            
    # 3. Setup Cognito User Pool
    print("\nSetting up AWS Cognito User Pool...")
    pool_name = "LaunchHubUserPool"
    pool_id = env.get("COGNITO_USER_POOL_ID")
    client_id = env.get("COGNITO_APP_CLIENT_ID")
    
    # Find existing pool if ID not present
    if not pool_id:
        try:
            pools = cognito.list_user_pools(MaxResults=60)
            for p in pools.get("UserPools", []):
                if p["Name"] == pool_name:
                    pool_id = p["Id"]
                    print(f"Found existing Cognito User Pool: {pool_name} ({pool_id})")
                    break
        except Exception as list_err:
            print(f"Warning: Could not list user pools: {str(list_err)}")
            
    if not pool_id:
        try:
            print(f"Creating User Pool: {pool_name}...")
            response = cognito.create_user_pool(
                PoolName=pool_name,
                Policies={
                    "PasswordPolicy": {
                        "MinimumLength": 8,
                        "RequireUppercase": True,
                        "RequireLowercase": True,
                        "RequireNumbers": True,
                        "RequireSymbols": False
                    }
                },
                UsernameAttributes=["email"],
                AutoVerifiedAttributes=["email"]
            )
            pool_id = response["UserPool"]["Id"]
            print(f"Created User Pool successfully: {pool_id}")
        except Exception as create_pool_err:
            print(f"Failed to create Cognito User Pool: {str(create_pool_err)}")
            sys.exit(1)
            
    # Setup App Client
    if pool_id and not client_id:
        client_name = "LaunchHubAppClient"
        try:
            clients = cognito.list_user_pool_clients(UserPoolId=pool_id, MaxResults=60)
            for c in clients.get("UserPoolClients", []):
                if c["ClientName"] == client_name:
                    client_id = c["ClientId"]
                    print(f"Found existing App Client: {client_name} ({client_id})")
                    break
        except Exception as list_clients_err:
            print(f"Warning: Could not list app clients: {str(list_clients_err)}")
            
        if not client_id:
            try:
                print(f"Creating App Client: {client_name}...")
                response = cognito.create_user_pool_client(
                    UserPoolId=pool_id,
                    ClientName=client_name,
                    GenerateSecret=False, # Disable secret for easier web SDK flow
                    ExplicitAuthFlows=[
                        "ALLOW_USER_PASSWORD_AUTH",
                        "ALLOW_REFRESH_TOKEN_AUTH",
                        "ALLOW_USER_SRP_AUTH"
                    ]
                )
                client_id = response["UserPoolClient"]["ClientId"]
                print(f"Created App Client successfully: {client_id}")
            except Exception as create_client_err:
                print(f"Failed to create App Client: {str(create_client_err)}")
                sys.exit(1)
                
    # 4. Save and Update Environment Config
    updates = {
        "COGNITO_USER_POOL_ID": pool_id,
        "COGNITO_APP_CLIENT_ID": client_id,
        "MOCK_AUTH": "False"
    }
    
    print("\nUpdating apps/api/.env with AWS resource details...")
    write_env_file(env_path, updates)
    print("Updated successfully!")
    print("\n========================================================")
    print("SUCCESS: AWS DynamoDB & Cognito integration complete!")
    print(f"Table Name:    {table_name}")
    print(f"User Pool ID:  {pool_id}")
    print(f"App Client ID: {client_id}")
    print("MOCK_AUTH:     False (Live mode activated!)")
    print("========================================================")
    print("Restart your FastAPI backend server for changes to take effect.")

if __name__ == "__main__":
    main()
