import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv
import os

load_dotenv()

def get_dynamodb_resource():
    if os.getenv("USE_LOCALSTACK", "false").lower() == "true":
        return boto3.resource(
            'dynamodb',
            endpoint_url="http://localhost:4566",
            aws_access_key_id="test",
            aws_secret_access_key="test",
            region_name="us-east-1"
        )
    else:
        return boto3.resource(
            'dynamodb',
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=os.getenv("AWS_REGION")
        )

def create_table(dynamodb_resource):
    try:
        table = dynamodb_resource.create_table(
            TableName='time_entries',
            KeySchema=[
                {
                    'AttributeName': 'id',
                    'KeyType': 'HASH'  # Partition key
                }
            ],
            AttributeDefinitions=[
                {
                    'AttributeName': 'id',
                    'AttributeType': 'S'
                }
            ],
            ProvisionedThroughput={
                'ReadCapacityUnits': 10,
                'WriteCapacityUnits': 10
            }
        )
        table.wait_until_exists()
        return table
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            return dynamodb_resource.Table('time_entries')
        else:
            raise e

dynamodb = get_dynamodb_resource()
time_entries_table = create_table(dynamodb)
