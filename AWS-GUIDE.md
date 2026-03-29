x# Yooti — AWS Local Development Guide

## Building and testing AWS microservices without deploying to the cloud

---

## Why local AWS development matters

Every time you deploy to AWS to test a change you pay three costs:

    Time      Deploy cycle is 2-5 minutes minimum
    Money     AWS charges for every invocation, storage, and transfer
    Risk      Bugs in staging cost more to fix than bugs caught locally

The tools in this guide let you run Lambda, DynamoDB, SQS, SNS,
EventBridge, and S3 on your laptop. No AWS account needed for development.
No cost. No deploy cycle. Bugs caught in seconds not minutes.

---

## The three environments — when to use each

```
ENVIRONMENT    TOOL          USE FOR                  COST     SPEED
─────────────  ────────────  ───────────────────────  ───────  ──────────
Local memory   moto          Unit tests               Free     Milliseconds
               (Python lib)  CI pipeline tests        Free     No Docker
                             TDD feedback loop                 needed

Local Docker   LocalStack    Integration tests        Free     Seconds
               (container)   Manual testing           Free     Docker
                             End-to-end local flows           required
                             Debugging service wiring

Real AWS       AWS cloud     Staging environment      Costs $  Minutes
                             Production               Costs $  Internet
                             Final verification                required
```

The rule: never call real AWS in any test. Never.

---

## Part 1 — Understanding the tools

---

### moto — fake AWS inside your tests

moto is a Python library that intercepts boto3 calls and handles them
in memory. Your production code does not change at all. You add one
decorator to your test and moto takes over.

    YOUR PRODUCTION CODE          YOUR TEST
    ──────────────────────────    ────────────────────────────────────
    import boto3                  from moto import mock_aws
    import os                     import boto3
                                  import pytest
    def handler(event, context):
        dynamodb = boto3.resource( @pytest.fixture(autouse=True)
            "dynamodb")           def aws_env(monkeypatch):
        table = dynamodb.Table(       monkeypatch.setenv(
            os.environ["TABLE"])          "AWS_ACCESS_KEY_ID", "testing")
        table.put_item(Item=item)     monkeypatch.setenv(
        return {"statusCode": 201}        "AWS_SECRET_ACCESS_KEY", "testing")
                                      monkeypatch.setenv(
                                          "TABLE", "orders-test")

                                  @mock_aws
                                  def test_creates_order():
                                      # Create the fake table
                                      dynamodb = boto3.resource(
                                          "dynamodb",
                                          region_name="us-east-1")
                                      table = dynamodb.create_table(
                                          TableName="orders-test",
                                          ...)

                                      # Call your real handler
                                      response = handler(event, None)
                                      assert response["statusCode"] == 201

When the test runs — no Docker, no internet, no credentials.
boto3 thinks it is talking to AWS. moto handles it in memory.
The test completes in milliseconds.

---

### LocalStack — real AWS services on your laptop

LocalStack is a Docker container that runs AWS service emulations.
It exposes a single port (4566) on your machine. Every AWS service
— DynamoDB, SQS, SNS, S3, Lambda, EventBridge, Firehose — is
available at http://localhost:4566.

Your code points to localhost instead of amazonaws.com:

    # Production code (real AWS)
    client = boto3.client("dynamodb")
    # Talks to: dynamodb.us-east-1.amazonaws.com

    # Same code with LocalStack
    os.environ["AWS_ENDPOINT_URL"] = "http://localhost:4566"
    client = boto3.client("dynamodb")
    # Talks to: localhost:4566

One environment variable change. No code changes. Everything else
— creating tables, putting items, sending messages — works identically.

---

## Part 2 — Complete setup from scratch

---

### Step 1 — Install prerequisites

    # Mac
    brew install awscli python@3.12
    brew install --cask docker

    # Windows
    winget install Amazon.AWSCLI Python.Python.3.12 Docker.DockerDesktop

    # Verify
    aws --version
    python3 --version
    docker --version

---

### Step 2 — Install Python AWS libraries

    # In your project virtualenv
    pip install boto3 moto[all] pytest pytest-env

    # Verify moto is installed
    python3 -c "from moto import mock_aws; print('moto ready')"

The `moto[all]` variant installs support for every AWS service.
If you only need specific services: `moto[dynamodb,sqs,sns]`

---

### Step 3 — Start LocalStack

If your project was created with Yooti and includes LocalStack
in docker-compose:

    docker compose up localstack -d

If setting up manually:

    docker run -d \
      --name localstack \
      -p 4566:4566 \
      -e SERVICES=s3,sqs,sns,dynamodb,lambda,events,firehose,secretsmanager \
      -e DEFAULT_REGION=us-east-1 \
      localstack/localstack:3

Verify it is healthy:

    curl http://localhost:4566/_localstack/health

Expected response:

    {
      "services": {
        "dynamodb": "running",
        "sqs": "running",
        "sns": "running",
        "s3": "running",
        "lambda": "running",
        "events": "running",
        "firehose": "running",
        "secretsmanager": "running"
      }
    }

---

### Step 4 — Configure your terminal for LocalStack

Add these to your .env file or run in your terminal session:

    # .env (Yooti loads this automatically)
    AWS_ACCESS_KEY_ID=test
    AWS_SECRET_ACCESS_KEY=test
    AWS_DEFAULT_REGION=us-east-1
    AWS_ENDPOINT_URL=http://localhost:4566

    # Table and queue names — match what you create locally
    TABLE_NAME=orders
    ORDERS_QUEUE_URL=http://localhost:4566/000000000000/orders-queue
    ORDERS_TOPIC_ARN=arn:aws:sns:us-east-1:000000000000:orders-topic
    EVENT_BUS_NAME=orders-events

The AWS credentials can be anything — LocalStack does not validate them.
The AWS_ENDPOINT_URL variable tells boto3 and the AWS CLI to talk to
LocalStack instead of real AWS.

---

## Part 3 — Creating local AWS resources

---

### Using the Yooti resource setup script

Yooti generates a setup script for your project:

    python scripts/create_local_resources.py

This creates all the DynamoDB tables, SQS queues, SNS topics, S3 buckets,
and EventBridge buses your project needs — in LocalStack.

Run it once after starting LocalStack. Run it again any time you want
to reset to a clean state (it skips resources that already exist).

---

### Creating resources manually with the AWS CLI

All standard AWS CLI commands work against LocalStack.
The only difference is the endpoint URL.

    # DynamoDB — create table
    aws dynamodb create-table \
      --table-name orders \
      --attribute-definitions \
        AttributeName=PK,AttributeType=S \
        AttributeName=SK,AttributeType=S \
      --key-schema \
        AttributeName=PK,KeyType=HASH \
        AttributeName=SK,KeyType=RANGE \
      --billing-mode PAY_PER_REQUEST

    # DynamoDB — list tables
    aws dynamodb list-tables

    # DynamoDB — scan (useful for local debugging, never in production code)
    aws dynamodb scan --table-name orders

    # DynamoDB — get a specific item
    aws dynamodb get-item \
      --table-name orders \
      --key '{"PK": {"S": "ORDER#123"}, "SK": {"S": "METADATA"}}'

    # SQS — create queue with dead letter queue
    aws sqs create-queue --queue-name orders-dlq
    aws sqs create-queue \
      --queue-name orders-queue \
      --attributes '{
        "RedrivePolicy": "{\"deadLetterTargetArn\":\"arn:aws:sqs:us-east-1:000000000000:orders-dlq\",\"maxReceiveCount\":\"3\"}"
      }'

    # SQS — list queues
    aws sqs list-queues

    # SQS — send a test message
    aws sqs send-message \
      --queue-url http://localhost:4566/000000000000/orders-queue \
      --message-body '{"orderId": "123", "product": "widget"}'

    # SQS — read messages
    aws sqs receive-message \
      --queue-url http://localhost:4566/000000000000/orders-queue

    # SNS — create topic
    aws sns create-topic --name orders-topic

    # SNS — list topics
    aws sns list-topics

    # SNS — publish a test message
    aws sns publish \
      --topic-arn arn:aws:sns:us-east-1:000000000000:orders-topic \
      --message '{"orderId": "123"}' \
      --message-attributes \
        '{"eventType": {"DataType": "String", "StringValue": "OrderCreated"}}'

    # S3 — create bucket
    aws s3 mb s3://orders-data

    # S3 — list buckets
    aws s3 ls

    # S3 — upload a file
    aws s3 cp myfile.json s3://orders-data/

    # EventBridge — create event bus
    aws events create-event-bus --name orders-events

    # EventBridge — put a test event
    aws events put-events \
      --entries '[{
        "Source": "myapp.orders",
        "DetailType": "OrderCreated",
        "Detail": "{\"orderId\": \"123\"}",
        "EventBusName": "orders-events"
      }]'

    # Secrets Manager — create a secret
    aws secretsmanager create-secret \
      --name myapp/database-password \
      --secret-string '{"password": "local-dev-password"}'

    # Secrets Manager — retrieve a secret
    aws secretsmanager get-secret-value \
      --secret-id myapp/database-password

Note: LocalStack account ID is always 000000000000 for local resources.
This is why queue URLs look like:
http://localhost:4566/000000000000/queue-name

---

## Part 4 — Running Lambda locally

---

### Option A — Direct Python invocation (simplest, fastest)

No SAM, no deployment. Just run the handler function directly:

    # scripts/invoke_local.py
    import json
    import os
    from dotenv import load_dotenv

    load_dotenv()  # loads your .env file

    # Import your handler after env vars are set
    from services.orders.src.handlers.create_order import handler

    # Build an API Gateway event
    event = {
        "httpMethod": "POST",
        "path": "/orders",
        "pathParameters": None,
        "queryStringParameters": None,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({
            "product": "widget",
            "quantity": 2,
            "customerId": "CUST-001"
        }),
        "isBase64Encoded": False
    }

    # Invoke the handler
    response = handler(event, None)

    print(f"Status:  {response['statusCode']}")
    print(f"Body:    {response['body']}")

Run it:

    python scripts/invoke_local.py
    # Status:  201
    # Body:    {"orderId": "ord-abc-123"}

Then verify the item was written to LocalStack DynamoDB:

    aws dynamodb scan --table-name orders

---

### Option B — SAM CLI (closest to real Lambda runtime)

SAM CLI runs your Lambda in a Docker container that matches the
real AWS Lambda execution environment.

Install SAM CLI:

    # Mac
    brew install aws-sam-cli

    # Windows
    winget install Amazon.SAM-CLI

    # Verify
    sam --version

Create a test event file:

    # events/create_order_valid.json
    {
      "httpMethod": "POST",
      "path": "/orders",
      "pathParameters": null,
      "queryStringParameters": null,
      "headers": {"Content-Type": "application/json"},
      "body": "{\"product\": \"widget\", \"quantity\": 2}",
      "isBase64Encoded": false
    }

Create an environment variables file for local invocation:

    # env.json
    {
      "CreateOrderFunction": {
        "TABLE_NAME": "orders",
        "ORDERS_QUEUE_URL": "http://localhost:4566/000000000000/orders-queue",
        "AWS_ENDPOINT_URL": "http://localhost:4566",
        "AWS_ACCESS_KEY_ID": "test",
        "AWS_SECRET_ACCESS_KEY": "test",
        "AWS_DEFAULT_REGION": "us-east-1"
      }
    }

Invoke the function:

    sam local invoke CreateOrderFunction \
      --event events/create_order_valid.json \
      --env-vars env.json

Test all event files:

    sam local invoke CreateOrderFunction \
      --event events/create_order_valid.json --env-vars env.json
    sam local invoke CreateOrderFunction \
      --event events/create_order_invalid.json --env-vars env.json
    sam local invoke CreateOrderFunction \
      --event events/create_order_duplicate.json --env-vars env.json

Start a local API Gateway (lets you use curl or Postman):

    sam local start-api --env-vars env.json --port 3001

    # Then test with curl
    curl -X POST http://localhost:3001/orders \
      -H "Content-Type: application/json" \
      -d '{"product": "widget", "quantity": 2}'

---

## Part 5 — Testing strategy

---

### Unit tests with moto

Unit tests run against moto — no Docker, no LocalStack, no internet.
These should be your primary test layer. Run them on every save.

    # tests/unit/test_create_order.py

    import json
    import boto3
    import pytest
    from moto import mock_aws
    from services.orders.src.handlers.create_order import handler


    @pytest.fixture(autouse=True)
    def aws_environment(monkeypatch):
        """Set fake AWS credentials and config for every test."""
        monkeypatch.setenv("AWS_ACCESS_KEY_ID", "testing")
        monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "testing")
        monkeypatch.setenv("AWS_DEFAULT_REGION", "us-east-1")
        monkeypatch.setenv("TABLE_NAME", "orders-test")


    @pytest.fixture
    def orders_table():
        """Create a fresh DynamoDB table for each test."""
        with mock_aws():
            dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
            table = dynamodb.create_table(
                TableName="orders-test",
                KeySchema=[
                    {"AttributeName": "PK", "KeyType": "HASH"},
                    {"AttributeName": "SK", "KeyType": "RANGE"},
                ],
                AttributeDefinitions=[
                    {"AttributeName": "PK", "AttributeType": "S"},
                    {"AttributeName": "SK", "AttributeType": "S"},
                ],
                BillingMode="PAY_PER_REQUEST",
            )
            yield table


    def api_event(body: dict) -> dict:
        return {
            "httpMethod": "POST",
            "body": json.dumps(body),
            "pathParameters": None,
            "queryStringParameters": None,
        }


    @mock_aws
    def test_valid_order_returns_201(orders_table):
        response = handler(api_event({"product": "widget", "quantity": 2}), None)
        assert response["statusCode"] == 201
        body = json.loads(response["body"])
        assert "orderId" in body


    @mock_aws
    def test_missing_product_returns_400(orders_table):
        response = handler(api_event({"quantity": 2}), None)
        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert "error" in body
        assert "Traceback" not in body["error"]
        assert "File " not in body["error"]


    @mock_aws
    def test_dynamodb_write_is_idempotent(orders_table):
        """Same order ID submitted twice should return 409 on second call."""
        event = api_event({"product": "widget", "quantity": 2, "orderId": "ORD-001"})
        first  = handler(event, None)
        second = handler(event, None)
        assert first["statusCode"] == 201
        assert second["statusCode"] == 409


    @mock_aws
    def test_item_written_to_dynamodb(orders_table):
        """Verify the item actually lands in DynamoDB."""
        response = handler(api_event({"product": "widget", "quantity": 2}), None)
        order_id = json.loads(response["body"])["orderId"]

        item = orders_table.get_item(
            Key={"PK": f"ORDER#{order_id}", "SK": "METADATA"}
        )
        assert "Item" in item
        assert item["Item"]["product"] == "widget"


Run unit tests:

    pytest tests/unit/ -v
    # Fast — no Docker needed — runs in seconds


### Integration tests with LocalStack

Integration tests run against LocalStack. They test the full service
wiring — handler, repository, and the actual DynamoDB/SQS interaction.

    # tests/integration/test_orders_integration.py

    import json
    import boto3
    import pytest
    import os
    from services.orders.src.handlers.create_order import handler


    ENDPOINT = os.environ.get("AWS_ENDPOINT_URL", "http://localhost:4566")


    @pytest.fixture(scope="session")
    def dynamodb_table():
        """Use the table created by create_local_resources.py."""
        dynamodb = boto3.resource(
            "dynamodb",
            region_name="us-east-1",
            endpoint_url=ENDPOINT,
        )
        return dynamodb.Table(os.environ["TABLE_NAME"])


    def test_full_create_order_flow(dynamodb_table):
        event = {
            "body": json.dumps({"product": "widget", "quantity": 2}),
            "pathParameters": None,
            "queryStringParameters": None,
        }
        response = handler(event, None)
        assert response["statusCode"] == 201

        order_id = json.loads(response["body"])["orderId"]
        item = dynamodb_table.get_item(
            Key={"PK": f"ORDER#{order_id}", "SK": "METADATA"}
        )
        assert "Item" in item


Run integration tests (LocalStack must be running):

    docker compose up localstack -d
    python scripts/create_local_resources.py
    pytest tests/integration/ -v


### Running both

    # Run everything
    pytest tests/ -v

    # Run only unit tests (no Docker needed)
    pytest tests/unit/ -v

    # Run only integration tests
    pytest tests/integration/ -v

    # Run with coverage
    pytest tests/unit/ --cov=src --cov-report=term-missing

---

## Part 6 — The Yooti pipeline for Lambda microservices

When you run `yooti sprint:start` and tell the agent to proceed to Phase 2
for a Lambda story, the agent generates plans in this structure:

    T001   DynamoDB schema + repository
           Tests use moto — no real DynamoDB calls
           Creates: models/order.py, repositories/order_repository.py
           Tests:   tests/unit/test_order_repository.py

    T002   Lambda handler + business logic
           Tests use moto — @mock_aws on every test
           Creates: handlers/create_order.py, services/order_service.py
           Tests:   tests/unit/test_create_order.py

    T003   SAM template + test events
           Creates: template.yaml, events/*.json
           Tests:   tests/unit/test_api_gateway_integration.py

The aws.md constitution enforces automatically:
    moto in every unit test — agent cannot forget this
    batchItemFailures for SQS — agent uses correct pattern
    conditional writes — idempotency by default
    no Scan operations — Query only
    all config from os.environ — no hardcoded ARNs or table names

---

## Part 7 — Environment variables reference

Complete list of environment variables for a Lambda microservice project:

    # AWS Engine (same for LocalStack and real AWS)
    AWS_ACCESS_KEY_ID=test                    # any value for LocalStack
    AWS_SECRET_ACCESS_KEY=test                # any value for LocalStack
    AWS_DEFAULT_REGION=us-east-1

    # LocalStack only (remove for real AWS)
    AWS_ENDPOINT_URL=http://localhost:4566

    # DynamoDB
    TABLE_NAME=orders

    # SQS
    ORDERS_QUEUE_URL=http://localhost:4566/000000000000/orders-queue
    ORDERS_DLQ_URL=http://localhost:4566/000000000000/orders-dlq

    # SNS
    ORDERS_TOPIC_ARN=arn:aws:sns:us-east-1:000000000000:orders-topic

    # EventBridge
    EVENT_BUS_NAME=orders-events

    # Firehose
    FIREHOSE_STREAM=orders-firehose

    # Secrets Manager
    APP_SECRET_NAME=myapp/api-key

    # Application
    LOG_LEVEL=INFO
    ALLOWED_ORIGIN=http://localhost:3000
    ENVIRONMENT=local

For real AWS, replace localhost values with real ARNs and URLs from
your AWS account. Remove AWS_ENDPOINT_URL entirely.

---

## Part 8 — Troubleshooting

---

### LocalStack not starting

    docker compose ps
    # Check if localstack container shows "unhealthy" or "exited"

    docker compose logs localstack
    # Read the error output

    # Common fix — port already in use
    lsof -i :4566        # Mac/Linux
    # Find the PID and kill it, then restart

    # Not enough Docker memory
    # Docker Desktop → Settings → Resources → Memory → 4GB minimum

---

### AWS CLI returns "Could not connect to the endpoint URL"

    # LocalStack is not running
    docker compose up localstack -d

    # Or AWS_ENDPOINT_URL is not set
    echo $AWS_ENDPOINT_URL
    # Should show: http://localhost:4566

    export AWS_ENDPOINT_URL=http://localhost:4566

---

### boto3 calls real AWS instead of LocalStack

    # AWS_ENDPOINT_URL is not set in your application
    # Add to your .env file:
    AWS_ENDPOINT_URL=http://localhost:4566

    # Verify your code loads .env
    from dotenv import load_dotenv
    load_dotenv()  # must be called before boto3 is imported

---

### moto tests calling real AWS

    # You forgot the @mock_aws decorator
    # Every test function that uses boto3 must have this decorator

    @mock_aws   # ← this is required
    def test_my_function():
        ...

    # Or the boto3 client is created at module level before @mock_aws activates
    # Move boto3 client creation inside the handler function or use a factory

---

### DynamoDB ResourceNotFoundException in tests

    # The table was not created before the test ran
    # Create it in a fixture:

    @pytest.fixture
    def orders_table():
        with mock_aws():
            dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
            table = dynamodb.create_table(
                TableName=os.environ["TABLE_NAME"],
                ...
            )
            yield table

---

### ConditionalCheckFailedException in tests

    # Your conditional write is working correctly
    # This is the expected behaviour when a duplicate record is submitted
    # Make sure your handler catches it and returns 409

    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return {"statusCode": 409, "body": json.dumps({"error": "Already exists"})}
        raise

---

## Part 9 — When you are ready for real AWS

Moving from LocalStack to real AWS is one environment variable change:

    # Remove this line from .env
    AWS_ENDPOINT_URL=http://localhost:4566

    # Replace LocalStack ARNs and URLs with real ones
    TABLE_NAME=myapp-orders-staging
    ORDERS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789/orders-queue
    ORDERS_TOPIC_ARN=arn:aws:sns:us-east-1:123456789:orders-topic

    # Add real credentials (or use IAM role if running on EC2/Lambda/ECS)
    AWS_ACCESS_KEY_ID=AKIA...
    AWS_SECRET_ACCESS_KEY=...

Deploy with SAM:

    sam build
    sam deploy \
      --stack-name myapp-orders-staging \
      --s3-bucket my-deployment-bucket \
      --capabilities CAPABILITY_IAM \
      --parameter-overrides Environment=staging

Or with CDK:

    cdk deploy MyappOrdersStack --context env=staging

Your unit tests still run against moto — they never need to change.
Your integration tests can run against real AWS staging if needed.

---

## Part 10 — Quick reference card

    START LOCALSTACK
    docker compose up localstack -d
    curl http://localhost:4566/_localstack/health

    CREATE LOCAL RESOURCES
    python scripts/create_local_resources.py

    RUN UNIT TESTS (no Docker needed)
    pytest tests/unit/ -v

    RUN INTEGRATION TESTS (LocalStack required)
    pytest tests/integration/ -v

    INVOKE LAMBDA LOCALLY (direct)
    python scripts/invoke_local.py

    INVOKE LAMBDA LOCALLY (SAM)
    sam local invoke FunctionName --event events/event.json --env-vars env.json

    START LOCAL API GATEWAY
    sam local start-api --env-vars env.json --port 3001

    CHECK DYNAMODB DATA
    aws dynamodb scan --table-name orders

    CHECK SQS QUEUE
    aws sqs receive-message --queue-url http://localhost:4566/000000000000/queue-name

    STOP LOCALSTACK
    docker compose stop localstack

---

*Yooti AWS Guide — v1.0*
