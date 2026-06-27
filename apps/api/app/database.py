import os
import json
import boto3
from decimal import Decimal
from botocore.exceptions import NoCredentialsError, ClientError
from app.config import settings

def _convert_floats_to_decimals(obj):
    if isinstance(obj, float):
        return Decimal(str(obj))
    elif isinstance(obj, dict):
        return {k: _convert_floats_to_decimals(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_convert_floats_to_decimals(v) for v in obj]
    return obj

def _deserialize_item(obj):
    """Recursively convert DynamoDB Decimal types to native Python float/int."""
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    elif isinstance(obj, dict):
        return {k: _deserialize_item(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_deserialize_item(v) for v in obj]
    return obj

def _deserialize_items(items):
    """Deserialize a list of DynamoDB items."""
    return [_deserialize_item(item) for item in items]


class MockDynamoDB:
    def __init__(self, filename="launchhub_dynamodb_mock.json"):
        self.filename = filename
        self._load_db()

    def _load_db(self):
        if not os.path.exists(self.filename):
            self.db = []
            self._save_db()
        else:
            try:
                with open(self.filename, "r") as f:
                    self.db = json.load(f)
            except Exception:
                self.db = []
                self._save_db()

    def _save_db(self):
        with open(self.filename, "w") as f:
            json.dump(self.db, f, indent=2)

    def put_item(self, Item):
        pk = Item.get("PK")
        sk = Item.get("SK")
        if not pk or not sk:
            raise ValueError("Item must have PK and SK")
        
        # Remove existing if any
        self.db = [x for x in self.db if not (x.get("PK") == pk and x.get("SK") == sk)]
        self.db.append(Item)
        self._save_db()
        return {"ResponseMetadata": {"HTTPStatusCode": 200}}

    def get_item(self, Key):
        pk = Key.get("PK")
        sk = Key.get("SK")
        for item in self.db:
            if item.get("PK") == pk and item.get("SK") == sk:
                return {"Item": item}
        return {}

    def delete_item(self, Key):
        pk = Key.get("PK")
        sk = Key.get("SK")
        initial_len = len(self.db)
        self.db = [x for x in self.db if not (x.get("PK") == pk and x.get("SK") == sk)]
        if len(self.db) < initial_len:
            self._save_db()
            return {"ResponseMetadata": {"HTTPStatusCode": 200}}
        return {"ResponseMetadata": {"HTTPStatusCode": 404}}

    def query(self, KeyConditionExpression, ExpressionAttributeValues, IndexName=None):
        results = []
        # KeyConditionExpression format: "PK = :pk AND SK = :sk" or "PK = :pk AND begins_with(SK, :sk)"
        # We can perform a basic parser
        target_pk = None
        target_sk_prefix = None
        target_sk = None

        # Clean values
        clean_values = {}
        for k, v in ExpressionAttributeValues.items():
            if isinstance(v, dict) and ("S" in v or "N" in v or "BOOL" in v):
                # Unwrap DynamoDB JSON types
                clean_values[k] = list(v.values())[0]
            else:
                clean_values[k] = v

        # Parse PK
        pk_var = ":pk"
        for k in clean_values.keys():
            if "pk" in k:
                pk_var = k
        target_pk = clean_values.get(pk_var)

        # Parse SK prefix or exact match
        sk_var = ":sk"
        for k in clean_values.keys():
            if "sk" in k:
                sk_var = k
        sk_val = clean_values.get(sk_var)
        
        is_begins = "begins_with" in KeyConditionExpression

        pk_field = "PK"
        sk_field = "SK"
        if IndexName == "GSI1":
            pk_field = "GSI1PK"
            sk_field = "GSI1SK"
        elif IndexName == "GSI2":
            pk_field = "GSI2PK"
            sk_field = "GSI2SK"

        for item in self.db:
            if item.get(pk_field) == target_pk:
                if sk_val is not None:
                    item_sk = item.get(sk_field, "")
                    if is_begins:
                        if item_sk.startswith(sk_val):
                            results.append(item)
                    else:
                        if item_sk == sk_val:
                            results.append(item)
                else:
                    results.append(item)
        
        return {"Items": results, "Count": len(results)}

    def scan(self, FilterExpression=None, ExpressionAttributeValues=None):
        # Return all for simple local filters
        if not FilterExpression:
            return {"Items": self.db, "Count": len(self.db)}
            
        clean_values = {}
        if ExpressionAttributeValues:
            for k, v in ExpressionAttributeValues.items():
                if isinstance(v, dict) and ("S" in v or "N" in v or "BOOL" in v):
                    clean_values[k] = list(v.values())[0]
                else:
                    clean_values[k] = v
                    
        results = []
        for item in self.db:
            # Quick custom filters for demo purposes
            matched = True
            if ExpressionAttributeValues:
                for attr, placeholder in [("category", ":cat"), ("extension", ":ext"), ("platform", ":plat"), ("dealType", ":deal")]:
                    if placeholder in clean_values and item.get(attr) != clean_values[placeholder]:
                        matched = False
                # Generic attribute match for username filter
                if ":uname" in clean_values and item.get("username") != clean_values[":uname"]:
                    matched = False
            if matched:
                results.append(item)
        return {"Items": results, "Count": len(results)}

    def update_item(self, Key, UpdateExpression, ExpressionAttributeValues, ExpressionAttributeNames=None):
        pk = Key.get("PK")
        sk = Key.get("SK")
        item_to_update = None
        for item in self.db:
            if item.get("PK") == pk and item.get("SK") == sk:
                item_to_update = item
                break
        
        if not item_to_update:
            # If not exists, create a basic item
            item_to_update = {"PK": pk, "SK": sk}
            self.db.append(item_to_update)

        clean_values = {}
        if ExpressionAttributeValues:
            for k, v in ExpressionAttributeValues.items():
                if isinstance(v, dict) and ("S" in v or "N" in v or "BOOL" in v):
                    clean_values[k] = list(v.values())[0]
                else:
                    clean_values[k] = v

        # Basic UpdateExpression parser: "SET #a = :a, #b = :b" or "SET a = :a, b = :b"
        if UpdateExpression and UpdateExpression.startswith("SET"):
            updates = UpdateExpression[4:].split(",")
            for part in updates:
                part = part.strip()
                if "=" in part:
                    left, right = part.split("=")
                    left = left.strip()
                    right = right.strip()
                    
                    # Resolve attribute name using Names map if applicable
                    attr_name = left
                    if ExpressionAttributeNames and left in ExpressionAttributeNames:
                        attr_name = ExpressionAttributeNames[left]
                    elif left.startswith("#"):
                        attr_name = left[1:] # strip hash if it was direct
                        
                    val = clean_values.get(right)
                    item_to_update[attr_name] = val
                    
        self._save_db()
        return {"Attributes": item_to_update}

# Establish real or mock DB client
class DatabaseManager:
    def __init__(self):
        self.table_name = settings.DYNAMODB_TABLE_NAME
        self.is_mock = True
        self.client = None
        
        # Try to connect to real DynamoDB if configured
        aws_key = os.getenv("AWS_ACCESS_KEY_ID")
        aws_secret = os.getenv("AWS_SECRET_ACCESS_KEY")
        
        if aws_key and aws_secret and not settings.MOCK_AUTH:
            try:
                dynamodb = boto3.resource(
                    "dynamodb",
                    region_name=settings.AWS_REGION,
                    aws_access_key_id=aws_key,
                    aws_secret_access_key=aws_secret
                )
                self.table = dynamodb.Table(self.table_name)
                # Verify access
                self.table.load()
                self.client = self.table
                self.is_mock = False
                print(f"Connected to AWS DynamoDB Table: {self.table_name}")
            except Exception as e:
                print(f"DynamoDB connection failed, falling back to Mock: {str(e)}")
                self.client = MockDynamoDB()
        else:
            self.client = MockDynamoDB()
            print("Running DynamoDB in MOCK LOCAL mode (launchhub_dynamodb_mock.json)")

    def put_item(self, Item):
        if self.is_mock:
            return self.client.put_item(Item)
        else:
            return self.client.put_item(Item=_convert_floats_to_decimals(Item))

    def get_item(self, Key):
        if self.is_mock:
            return self.client.get_item(Key)
        else:
            res = self.client.get_item(Key=Key)
            item = res.get("Item")
            return {"Item": _deserialize_item(item)} if item else {}

    def delete_item(self, Key):
        if self.is_mock:
            return self.client.delete_item(Key)
        else:
            return self.client.delete_item(Key=Key)

    def query(self, KeyConditionExpression, ExpressionAttributeValues, IndexName=None):
        if self.is_mock:
            return self.client.query(KeyConditionExpression, ExpressionAttributeValues, IndexName)
        else:
            kwargs = {
                "KeyConditionExpression": KeyConditionExpression,
                "ExpressionAttributeValues": ExpressionAttributeValues
            }
            if IndexName:
                kwargs["IndexName"] = IndexName
            res = self.client.query(**kwargs)
            items = _deserialize_items(res.get("Items", []))
            return {"Items": items, "Count": len(items)}

    def scan(self, FilterExpression=None, ExpressionAttributeValues=None):
        if self.is_mock:
            return self.client.scan(FilterExpression, ExpressionAttributeValues)
        else:
            kwargs = {}
            if FilterExpression:
                kwargs["FilterExpression"] = FilterExpression
            if ExpressionAttributeValues:
                kwargs["ExpressionAttributeValues"] = ExpressionAttributeValues
            res = self.client.scan(**kwargs)
            items = _deserialize_items(res.get("Items", []))
            return {"Items": items, "Count": len(items)}

    def update_item(self, Key, UpdateExpression, ExpressionAttributeValues, ExpressionAttributeNames=None):
        if self.is_mock:
            return self.client.update_item(Key, UpdateExpression, ExpressionAttributeValues, ExpressionAttributeNames)
        else:
            kwargs = {
                "Key": Key,
                "UpdateExpression": UpdateExpression,
                "ExpressionAttributeValues": _convert_floats_to_decimals(ExpressionAttributeValues),
                "ReturnValues": "ALL_NEW"
            }
            if ExpressionAttributeNames:
                kwargs["ExpressionAttributeNames"] = ExpressionAttributeNames
            res = self.client.update_item(**kwargs)
            attrs = res.get("Attributes", {})
            return {"Attributes": _deserialize_item(attrs)}

db = DatabaseManager()
