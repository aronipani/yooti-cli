# Yooti — AWS Configuration Build Prompts
# Run these in Claude Code in order — one session per task group

---

# SESSION 1 — AWS wizard questions + constitution + LocalStack

Read src/generator.js and src/wizard.js (or wherever the init wizard
questions are defined) before starting. Do not modify anything outside
the files named in each task.

---

## TASK 1A — Add AWS questions to the yooti init wizard

Find the wizard question array in the init command. Add these questions
after the existing stack selection question:

```javascript
{
  type: 'confirm',
  name: 'includeAws',
  message: 'Does this project use AWS services?',
  default: false,
},
{
  type: 'checkbox',
  name: 'awsServices',
  message: 'Which AWS services will this project use?',
  when: (answers) => answers.includeAws,
  choices: [
    { name: 'Lambda + API Gateway',    value: 'lambda',       checked: true },
    { name: 'DynamoDB',                value: 'dynamodb',     checked: true },
    { name: 'SQS',                     value: 'sqs',          checked: false },
    { name: 'SNS',                     value: 'sns',          checked: false },
    { name: 'EventBridge',             value: 'eventbridge',  checked: false },
    { name: 'Kinesis Firehose',        value: 'firehose',     checked: false },
    { name: 'Fargate',                 value: 'fargate',      checked: false },
    { name: 'S3',                      value: 's3',           checked: false },
    { name: 'Secrets Manager',         value: 'secrets',      checked: false },
  ],
},
{
  type: 'list',
  name: 'awsDeploy',
  message: 'How will you deploy AWS services?',
  when: (answers) => answers.includeAws,
  choices: [
    { name: 'SAM (AWS Serverless Application Model) — recommended', value: 'sam' },
    { name: 'CDK (AWS Cloud Development Kit)',                       value: 'cdk' },
    { name: 'Manual / existing pipeline',                            value: 'manual' },
  ],
  default: 'sam',
},
{
  type: 'list',
  name: 'awsRegion',
  message: 'Primary AWS region?',
  when: (answers) => answers.includeAws,
  choices: [
    { name: 'us-east-1 (N. Virginia)',    value: 'us-east-1' },
    { name: 'us-west-2 (Oregon)',         value: 'us-west-2' },
    { name: 'eu-west-1 (Ireland)',        value: 'eu-west-1' },
    { name: 'eu-central-1 (Frankfurt)',   value: 'eu-central-1' },
    { name: 'ap-southeast-1 (Singapore)', value: 'ap-southeast-1' },
    { name: 'ap-northeast-1 (Tokyo)',     value: 'ap-northeast-1' },
  ],
  default: 'us-east-1',
},
```

Store the answers in config:

```javascript
config.includeAws   = answers.includeAws   || false
config.awsServices  = answers.awsServices  || []
config.awsDeploy    = answers.awsDeploy    || 'sam'
config.awsRegion    = answers.awsRegion    || 'us-east-1'
```

---

## TASK 1B — Add awsConstitution() template function to generator.js

Add this function to generator.js. Call it from generateFiles() when
config.includeAws is true:

```javascript
function awsConstitution(config) {
  const services = config.awsServices || []
  const hasLambda      = services.includes('lambda')
  const hasDynamoDB    = services.includes('dynamodb')
  const hasSQS         = services.includes('sqs')
  const hasSNS         = services.includes('sns')
  const hasEventBridge = services.includes('eventbridge')
  const hasFirehose    = services.includes('firehose')
  const hasFargate     = services.includes('fargate')

  return `# AWS Services Constitution
# Applies to: ${services.join(', ') || 'AWS services'}
# The agent reads this before writing any AWS service code.

## The golden rule
Write code as if AWS services can fail at any time.
Every call can return a transient error.
Every SQS message can be delivered twice.
Every Lambda can cold-start. Design for this.

## Testing — mandatory
Never call real AWS services in unit tests.
Use moto for Python — @mock_aws on every test that touches boto3.
Use LocalStack for integration tests (docker compose up localstack -d).

    from moto import mock_aws
    import boto3

    @pytest.fixture(autouse=True)
    def aws_credentials(monkeypatch):
        monkeypatch.setenv("AWS_ACCESS_KEY_ID", "testing")
        monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "testing")
        monkeypatch.setenv("AWS_DEFAULT_REGION", "${config.awsRegion || 'us-east-1'}")

    @mock_aws
    def test_something():
        # Create the fake resource inside the mock context
        dynamodb = boto3.resource("dynamodb", region_name="${config.awsRegion || 'us-east-1'}")
        ...

${hasLambda ? `
## Lambda

Handler signature — always this exact shape:

    def handler(event: dict, context: Any) -> dict:
        return {"statusCode": 200, "body": json.dumps(result)}

Rules:
  No global mutable state between invocations
  boto3 clients at module level are fine — they are not state
  Log the event at DEBUG level only — never INFO (PII risk)
  All config from os.environ — never hardcoded ARNs or table names
  Missing required env var → raise ValueError at import time
  Catch all exceptions — never let one propagate uncaught from handler

## API Gateway

Event parsing — body is always a JSON string, never a dict:

    body      = json.loads(event.get("body") or "{}")
    path_id   = event["pathParameters"]["id"]
    query_val = (event.get("queryStringParameters") or {}).get("page", "1")

Status codes:
    201 — created
    400 — validation error (safe to show message)
    401 — unauthenticated
    403 — unauthorised
    404 — not found
    409 — conflict or duplicate
    500 — unexpected (NEVER expose internal detail to caller)

Error responses never include stack traces, file paths, or exception types.
` : ''}
${hasDynamoDB ? `
## DynamoDB

Single table design — one DynamoDB table per service.
Use composite keys. Do not create separate tables per entity type.

Key patterns:
    PK: USER#<user_id>    SK: PROFILE
    PK: USER#<user_id>    SK: ORDER#<order_id>
    PK: ORDER#<order_id>  SK: METADATA

NEVER use Scan. ALWAYS Query with KeyConditionExpression:

    # WRONG
    table.scan(FilterExpression=Attr("status").eq("active"))

    # CORRECT
    table.query(
        KeyConditionExpression=Key("PK").eq(f"USER#{user_id}"),
        FilterExpression=Attr("status").eq("active"),
    )

Idempotency — use conditional writes to prevent duplicates:

    table.put_item(
        Item=item,
        ConditionExpression="attribute_not_exists(PK)",
    )

Error handling — always catch ClientError and check the code:

    from botocore.exceptions import ClientError
    try:
        table.put_item(Item=item, ConditionExpression="attribute_not_exists(PK)")
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            raise DuplicateItemError(item["PK"])
        raise

Table name always from environment variable:
    TABLE_NAME = os.environ["TABLE_NAME"]
` : ''}
${hasSQS ? `
## SQS

Always process as a batch — return batchItemFailures, never fail the whole batch:

    def handler(event: dict, context: Any) -> dict:
        failures = []
        for record in event["Records"]:
            try:
                process(json.loads(record["body"]))
            except Exception as e:
                log.error("processing_failed", id=record["messageId"], error=str(e))
                failures.append({"itemIdentifier": record["messageId"]})
        return {"batchItemFailures": failures}

Rules:
  Handlers must be idempotent — the same message may arrive twice
  Every SQS queue must have a dead letter queue — no exceptions
  Visibility timeout must exceed Lambda timeout plus 30 seconds
  Never delete messages manually — use batchItemFailures
  Queue URLs always from os.environ — never hardcoded
` : ''}
${hasSNS ? `
## SNS

Fan-out pattern — SNS → SQS → Lambda. Never SNS → Lambda directly in production.
Use MessageAttributes for subscription filtering — not body inspection.
Design messages to be replayable.
Topic ARNs always from os.environ — never hardcoded.
` : ''}
${hasEventBridge ? `
## EventBridge

Event schema — always include source, detail-type, and detail:

    events.put_events(Entries=[{
        "Source": "${config.projectName}.service-name",
        "DetailType": "EntityCreated",
        "Detail": json.dumps({"id": entity_id, "timestamp": iso_timestamp}),
        "EventBusName": os.environ["EVENT_BUS_NAME"],
    }])

Rules:
  Register all custom schemas in the EventBridge schema registry
  Include enough context — consumers must not need to call back
  Events must be replayable — design for archive replay
  Prefer SQS as rule target — not Lambda directly
` : ''}
${hasFirehose ? `
## Kinesis Firehose

Batch writes only — never PutRecord in a loop:

    firehose.put_record_batch(
        DeliveryStreamName=os.environ["FIREHOSE_STREAM"],
        Records=[{"Data": json.dumps(r) + "\\n"} for r in records],
    )

Transformation Lambda must return exactly this shape — no variation:

    return {"records": [
        {
            "recordId": r["recordId"],
            "result": "Ok",
            "data": base64.b64encode(
                (json.dumps(transformed) + "\\n").encode()
            ).decode()
        }
        for r in event["records"]
    ]}

S3 prefix — always partitioned for Athena:

    year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/
` : ''}
${hasFargate ? `
## Fargate

Every container must expose GET /health:

    @app.get("/health")
    def health():
        return {"status": "ok", "service": "${config.projectName}"}

Graceful shutdown — handle SIGTERM before exit:

    import signal, sys
    def handle_sigterm(*args):
        # drain connections, finish in-flight requests
        sys.exit(0)
    signal.signal(signal.SIGTERM, handle_sigterm)

All config from environment variables — never hardcoded.
Secrets from AWS Secrets Manager — never in environment variables directly.
Always set explicit CPU and memory limits in task definition.
` : ''}
## Credentials and secrets (all services)

  Never hardcode AWS credentials — use IAM roles on Lambda and Fargate
  Never put secrets in environment variables — use Secrets Manager
  Never commit .env with real credentials — .env is always in .gitignore
  Cache Secrets Manager calls with @lru_cache to avoid per-invocation calls

## Local development

LocalStack runs at http://localhost:4566
Start with: docker compose up localstack -d
Create resources with: python scripts/create_local_resources.py
Invoke Lambda locally: python scripts/invoke_local.py

boto3 client pointing at LocalStack:

    import os
    client = boto3.client(
        "dynamodb",
        endpoint_url=os.environ.get("AWS_ENDPOINT_URL"),
        region_name="${config.awsRegion || 'us-east-1'}",
    )

When AWS_ENDPOINT_URL is not set (staging/production) boto3 uses real AWS.
`
}
```

Write call in generateFiles():

```javascript
if (config.includeAws) {
  write('.claude/constitutions/aws.md', awsConstitution(config))
}
```

---

## TASK 1C — Add LocalStack to dockerComposeTemplate()

Find the docker-compose template function. Add LocalStack when includeAws is true:

```javascript
if (config.includeAws) {
  services.localstack = {
    image: 'localstack/localstack:3',
    ports: ['4566:4566'],
    environment: [
      `SERVICES=${buildLocalStackServices(config.awsServices)}`,
      `DEFAULT_REGION=${config.awsRegion || 'us-east-1'}`,
      `AWS_DEFAULT_REGION=${config.awsRegion || 'us-east-1'}`,
    ],
    volumes: [
      './localstack-data:/var/lib/localstack',
      '/var/run/docker.sock:/var/run/docker.sock',
    ],
    healthcheck: {
      test: ['CMD', 'curl', '-f', 'http://localhost:4566/_localstack/health'],
      interval: '10s',
      timeout: '5s',
      retries: 5,
    },
    restart: 'unless-stopped',
  }
}

function buildLocalStackServices(awsServices = []) {
  const serviceMap = {
    lambda:      'lambda',
    dynamodb:    'dynamodb',
    sqs:         'sqs',
    sns:         'sns',
    eventbridge: 'events',
    firehose:    'firehose',
    s3:          's3',
    secrets:     'secretsmanager',
    fargate:     'ecs',
  }
  const defaults = ['s3', 'sqs', 'sns', 'dynamodb', 'lambda', 'events',
                    'firehose', 'secretsmanager']
  const selected = awsServices.map(s => serviceMap[s]).filter(Boolean)
  const merged = [...new Set([...defaults, ...selected])]
  return merged.join(',')
}
```

Also add to .gitignore template:

```javascript
// In gitignoreTemplate() add:
'localstack-data/'
```

---

# SESSION 2 — Generated scripts and templates

Read src/generator.js before starting.

---

## TASK 2A — Generate scripts/create_local_resources.py

Add this template function and call it from generateFiles() when
config.includeAws is true:

```javascript
function createLocalResourcesScript(config) {
  const services  = config.awsServices || []
  const region    = config.awsRegion || 'us-east-1'
  const name      = config.projectName
  const hasDynamo = services.includes('dynamodb')
  const hasSQS    = services.includes('sqs')
  const hasSNS    = services.includes('sns')
  const hasS3     = services.includes('s3')
  const hasEB     = services.includes('eventbridge')

  return `#!/usr/bin/env python3
"""
Create local AWS resources in LocalStack.
Run once after: docker compose up localstack -d

Usage:
    python scripts/create_local_resources.py
"""
import boto3
import json
import os
import sys
import time

ENDPOINT  = os.environ.get("AWS_ENDPOINT_URL", "http://localhost:4566")
REGION    = os.environ.get("AWS_DEFAULT_REGION", "${region}")
CREDS     = {
    "endpoint_url":          ENDPOINT,
    "region_name":           REGION,
    "aws_access_key_id":     os.environ.get("AWS_ACCESS_KEY_ID", "test"),
    "aws_secret_access_key": os.environ.get("AWS_SECRET_ACCESS_KEY", "test"),
}


def wait_for_localstack():
    import urllib.request
    for attempt in range(30):
        try:
            urllib.request.urlopen(f"{ENDPOINT}/_localstack/health", timeout=2)
            print(f"✓ LocalStack is ready at {ENDPOINT}")
            return
        except Exception:
            print(f"  Waiting for LocalStack... ({attempt + 1}/30)")
            time.sleep(2)
    print("✗ LocalStack did not start in time")
    print("  Run: docker compose up localstack -d")
    sys.exit(1)

${hasDynamo ? `
def create_dynamodb_tables():
    client = boto3.client("dynamodb", **CREDS)
    tables = [
        {
            "TableName": "${name}",
            "AttributeDefinitions": [
                {"AttributeName": "PK", "AttributeType": "S"},
                {"AttributeName": "SK", "AttributeType": "S"},
            ],
            "KeySchema": [
                {"AttributeName": "PK", "KeyType": "HASH"},
                {"AttributeName": "SK", "KeyType": "RANGE"},
            ],
            "BillingMode": "PAY_PER_REQUEST",
        }
    ]
    for table in tables:
        try:
            client.create_table(**table)
            print(f"✓ DynamoDB table: {table['TableName']}")
        except client.exceptions.ResourceInUseException:
            print(f"~ DynamoDB table exists: {table['TableName']}")
` : ''}
${hasSQS ? `
def create_sqs_queues():
    client = boto3.client("sqs", **CREDS)
    queues = [
        {"QueueName": "${name}-dlq"},
        {"QueueName": "${name}-queue"},
    ]
    for q in queues:
        client.create_queue(**q)
        print(f"✓ SQS queue: {q['QueueName']}")
` : ''}
${hasSNS ? `
def create_sns_topics():
    client = boto3.client("sns", **CREDS)
    response = client.create_topic(Name="${name}-topic")
    print(f"✓ SNS topic: {response['TopicArn']}")
    return response['TopicArn']
` : ''}
${hasS3 ? `
def create_s3_buckets():
    client = boto3.client("s3", **CREDS)
    buckets = ["${name}-data", "${name}-firehose"]
    for bucket in buckets:
        try:
            client.create_bucket(Bucket=bucket)
            print(f"✓ S3 bucket: {bucket}")
        except Exception as e:
            if "BucketAlreadyOwnedByYou" in str(e):
                print(f"~ S3 bucket exists: {bucket}")
            else:
                raise
` : ''}
${hasEB ? `
def create_eventbridge_bus():
    client = boto3.client("events", **CREDS)
    try:
        client.create_event_bus(Name="${name}-bus")
        print("✓ EventBridge bus: ${name}-bus")
    except client.exceptions.ResourceAlreadyExistsException:
        print("~ EventBridge bus exists: ${name}-bus")
` : ''}

if __name__ == "__main__":
    print(f"Creating local AWS resources in LocalStack ({ENDPOINT})...\\n")
    wait_for_localstack()
${hasDynamo ? '    create_dynamodb_tables()' : ''}
${hasSQS    ? '    create_sqs_queues()' : ''}
${hasSNS    ? '    create_sns_topics()' : ''}
${hasS3     ? '    create_s3_buckets()' : ''}
${hasEB     ? '    create_eventbridge_bus()' : ''}
    print("\\n✓ Local environment ready")
    print(f"  All services at {ENDPOINT}")
    print("\\nQuick checks:")
${hasDynamo ? `    print("  aws dynamodb list-tables")` : ''}
${hasSQS    ? `    print("  aws sqs list-queues")` : ''}
${hasS3     ? `    print("  aws s3 ls")` : ''}
`
}
```

Write call in generateFiles():

```javascript
if (config.includeAws) {
  write('scripts/create_local_resources.py', createLocalResourcesScript(config))
}
```

---

## TASK 2B — Generate scripts/invoke_local.py

```javascript
function invokeLocalScript(config) {
  const name = config.projectName
  return `#!/usr/bin/env python3
"""
Invoke a Lambda handler locally against LocalStack.
Edit the EVENT dict to match your use case.

Usage:
    python scripts/invoke_local.py
    python scripts/invoke_local.py --handler src.handlers.my_handler
"""
import argparse
import importlib
import json
import os
import sys
from dotenv import load_dotenv

# Load .env — sets AWS_ENDPOINT_URL to point at LocalStack
load_dotenv()

# Default test event — edit this to match your handler's input
EVENT = {
    "httpMethod": "POST",
    "path": "/items",
    "pathParameters": None,
    "queryStringParameters": None,
    "headers": {"Content-Type": "application/json"},
    "body": json.dumps({
        "name": "test-item",
        "value": 42,
    }),
    "isBase64Encoded": False,
}


class LocalContext:
    """Minimal Lambda context object for local testing."""
    function_name    = "${name}-local"
    memory_limit_in_mb = 128
    aws_request_id   = "local-invoke-001"
    invoked_function_arn = "arn:aws:lambda:us-east-1:000000000000:function:${name}"
    def get_remaining_time_in_millis(self): return 30000


def invoke(handler_path: str, event: dict):
    module_path, func_name = handler_path.rsplit(".", 1)
    module = importlib.import_module(module_path)
    handler_func = getattr(module, func_name)

    print(f"Invoking {handler_path}")
    print(f"Endpoint: {os.environ.get('AWS_ENDPOINT_URL', 'real AWS')}")
    print(f"Event: {json.dumps(event, indent=2)}\\n")

    response = handler_func(event, LocalContext())

    print(f"Status:  {response.get('statusCode')}")
    try:
        body = json.loads(response.get("body", "{}"))
        print(f"Body:\\n{json.dumps(body, indent=2)}")
    except Exception:
        print(f"Body: {response.get('body')}")
    return response


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--handler", default="src.handlers.create_item.handler",
                        help="Python module path to handler function")
    parser.add_argument("--event", help="Path to JSON event file")
    args = parser.parse_args()

    event = EVENT
    if args.event:
        with open(args.event) as f:
            event = json.load(f)

    invoke(args.handler, event)
`
}
```

Write call:

```javascript
if (config.includeAws) {
  write('scripts/invoke_local.py', invokeLocalScript(config))
}
```

---

## TASK 2C — Generate test event files

```javascript
function generateTestEvents(config) {
  const services = config.awsServices || []
  const hasLambda = services.includes('lambda')
  const hasSQS    = services.includes('sqs')

  if (!hasLambda) return

  // API Gateway POST event
  write('events/api_post_valid.json', JSON.stringify({
    httpMethod: 'POST',
    path: '/items',
    pathParameters: null,
    queryStringParameters: null,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'test-item', value: 42 }),
    isBase64Encoded: false,
  }, null, 2))

  // API Gateway POST invalid
  write('events/api_post_invalid.json', JSON.stringify({
    httpMethod: 'POST',
    path: '/items',
    pathParameters: null,
    queryStringParameters: null,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
    isBase64Encoded: false,
  }, null, 2))

  // API Gateway GET with path param
  write('events/api_get_by_id.json', JSON.stringify({
    httpMethod: 'GET',
    path: '/items/abc-123',
    pathParameters: { id: 'abc-123' },
    queryStringParameters: null,
    headers: {},
    body: null,
    isBase64Encoded: false,
  }, null, 2))

  if (hasSQS) {
    // SQS batch event
    write('events/sqs_batch.json', JSON.stringify({
      Records: [
        {
          messageId: 'msg-001',
          receiptHandle: 'receipt-001',
          body: JSON.stringify({ id: 'item-001', action: 'process' }),
          attributes: { ApproximateReceiveCount: '1' },
          messageAttributes: {},
          md5OfBody: '',
          eventSource: 'aws:sqs',
          eventSourceARN: `arn:aws:sqs:us-east-1:000000000000:${config.projectName}-queue`,
          awsRegion: config.awsRegion || 'us-east-1',
        },
        {
          messageId: 'msg-002',
          receiptHandle: 'receipt-002',
          body: JSON.stringify({ id: 'item-002', action: 'process' }),
          attributes: { ApproximateReceiveCount: '1' },
          messageAttributes: {},
          md5OfBody: '',
          eventSource: 'aws:sqs',
          eventSourceARN: `arn:aws:sqs:us-east-1:000000000000:${config.projectName}-queue`,
          awsRegion: config.awsRegion || 'us-east-1',
        },
      ],
    }, null, 2))
  }
}
```

Call in generateFiles():

```javascript
if (config.includeAws) {
  generateTestEvents(config)
}
```

---

## TASK 2D — Generate SAM template stub

```javascript
function samTemplate(config) {
  const name   = config.projectName
  const region = config.awsRegion || 'us-east-1'
  const services = config.awsServices || []
  const hasDynamo = services.includes('dynamodb')
  const hasSQS    = services.includes('sqs')

  return `AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: ${name} — generated by Yooti

Globals:
  Function:
    Timeout: 30
    MemorySize: 256
    Runtime: python3.12
    Architectures: [arm64]
    Environment:
      Variables:
        LOG_LEVEL: INFO
        AWS_ACCOUNT_ID: !Ref AWS::AccountId
${hasDynamo ? `        TABLE_NAME: !Ref MainTable` : ''}
${hasSQS    ? `        QUEUE_URL: !Ref MainQueue` : ''}

Parameters:
  Environment:
    Type: String
    Default: dev
    AllowedValues: [dev, staging, prod]

Resources:

  # ── Lambda Functions ────────────────────────────────────────────────────────

  CreateItemFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub "${name}-create-item-\${Environment}"
      CodeUri: src/
      Handler: handlers.create_item.handler
      Events:
        Api:
          Type: Api
          Properties:
            Path: /items
            Method: POST
      Policies:
${hasDynamo ? `        - DynamoDBCrudPolicy:
            TableName: !Ref MainTable` : ''}
${hasSQS    ? `        - SQSSendMessagePolicy:
            QueueName: !GetAtt MainQueue.QueueName` : ''}

${hasDynamo ? `
  # ── DynamoDB ────────────────────────────────────────────────────────────────

  MainTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub "${name}-\${Environment}"
      BillingMode: PAY_PER_REQUEST
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      AttributeDefinitions:
        - AttributeName: PK
          AttributeType: S
        - AttributeName: SK
          AttributeType: S
      KeySchema:
        - AttributeName: PK
          KeyType: HASH
        - AttributeName: SK
          KeyType: RANGE
      SSESpecification:
        SSEEnabled: true
` : ''}
${hasSQS ? `
  # ── SQS ─────────────────────────────────────────────────────────────────────

  MainQueueDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub "${name}-dlq-\${Environment}"
      MessageRetentionPeriod: 1209600  # 14 days

  MainQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub "${name}-queue-\${Environment}"
      VisibilityTimeout: 90
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt MainQueueDLQ.Arn
        maxReceiveCount: 3
` : ''}

Outputs:
  ApiEndpoint:
    Description: API Gateway endpoint URL
    Value: !Sub "https://\${ServerlessRestApi}.execute-api.${region}.amazonaws.com/Prod/"
${hasDynamo ? `  TableName:
    Value: !Ref MainTable` : ''}
${hasSQS    ? `  QueueUrl:
    Value: !Ref MainQueue` : ''}
`
}
```

Write call in generateFiles():

```javascript
if (config.includeAws && config.awsDeploy === 'sam') {
  write('template.yaml', samTemplate(config))
}
```

---

## TASK 2E — Generate complete .env.example for AWS projects

```javascript
function awsEnvExample(config) {
  const services  = config.awsServices || []
  const region    = config.awsRegion || 'us-east-1'
  const name      = config.projectName
  const account   = '000000000000'  // LocalStack default

  return `# ─────────────────────────────────────────────────────────────────
# LOCAL DEVELOPMENT — points to LocalStack
# For staging/production: remove AWS_ENDPOINT_URL and set real values
# NEVER commit real credentials to version control
# ─────────────────────────────────────────────────────────────────

# LocalStack credentials (fake — LocalStack accepts anything)
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_DEFAULT_REGION=${region}

# Redirects all boto3 calls to LocalStack
# Remove this line for staging/production
AWS_ENDPOINT_URL=http://localhost:4566

${services.includes('dynamodb') ? `# DynamoDB
TABLE_NAME=${name}
` : ''}${services.includes('sqs') ? `# SQS
QUEUE_URL=http://localhost:4566/${account}/${name}-queue
DLQ_URL=http://localhost:4566/${account}/${name}-dlq
` : ''}${services.includes('sns') ? `# SNS
SNS_TOPIC_ARN=arn:aws:sns:${region}:${account}:${name}-topic
` : ''}${services.includes('eventbridge') ? `# EventBridge
EVENT_BUS_NAME=${name}-bus
` : ''}${services.includes('firehose') ? `# Firehose
FIREHOSE_STREAM=${name}-firehose
` : ''}${services.includes('s3') ? `# S3
S3_BUCKET=${name}-data
` : ''}${services.includes('secrets') ? `# Secrets Manager (local ARN format)
DB_SECRET_ARN=arn:aws:secretsmanager:${region}:${account}:secret:${name}-db-creds
` : ''}
# Application
LOG_LEVEL=INFO
`
}
```

---

## TASK 2F — Generate aws-lambda.json story type template

```javascript
function awsLambdaStoryTemplate() {
  return JSON.stringify({
    type: 'aws-lambda',
    description: 'AWS Lambda microservice — API Gateway + DynamoDB + optional SQS/SNS/EventBridge',
    required_fields: ['story_id', 'title', 'api_endpoints', 'acceptance_criteria'],
    acceptance_criteria_guidance: [
      'AC-1: Happy path — valid input returns expected response (201/200)',
      'AC-2: Validation error — missing/invalid fields return 400 with a message (no stack trace)',
      'AC-3: Conflict/duplicate — same resource submitted twice returns 409',
      'AC-4: AWS failure — DynamoDB/SQS unavailable returns 500 with no internal detail exposed',
      'AC-5: Auth — unauthenticated request returns 401',
    ].join('\n'),
    definition_of_done: [
      'All AC have passing unit tests using moto — no real AWS calls in any test',
      'SQS handlers return batchItemFailures — never fail the whole batch',
      'DynamoDB uses single table design — no Scan operations anywhere',
      'Coverage on new code >= 90%',
      'Security scan: 0 HIGH/CRITICAL',
      'No credentials, ARNs, or table names hardcoded — all from os.environ',
      'SAM template or CDK stack present and reviewed at Gate G2',
    ],
    constitutions_to_apply: ['python', 'aws', 'security', 'testing'],
    layers: ['api', 'database'],
    decomposition_hint: [
      'T001 — DynamoDB schema + repository layer (moto tests only — no real AWS)',
      'T002 — Lambda handler + service + validator (unit tests with moto)',
      'T003 — SAM/CDK definition + test event files',
    ].join('\n'),
    estimated_complexity: 'M',
  }, null, 2)
}
```

Write call in generateFiles():

```javascript
if (config.includeAws) {
  write('.agent/templates/aws-lambda.json', awsLambdaStoryTemplate())
}
```

---

# SESSION 3 — CLAUDE.md + REQUIREMENTS.md + docs updates

Read src/generator.js and the claudeMdTemplate() function before starting.

---

## TASK 3A — Reference aws.md in CLAUDE.md template

In claudeMdTemplate(), find the constitutions section. Add:

```javascript
${config.includeAws ? `
AWS services:        .claude/constitutions/aws.md
  Covers: ${(config.awsServices || []).join(', ')}
  Rules: moto in every unit test, single table DynamoDB, batchItemFailures SQS,
         no hardcoded ARNs, Secrets Manager for credentials, LocalStack locally` : ''}
```

---

## TASK 3B — Add AWS section to CLAUDE.md pipeline context

In claudeMdTemplate(), find the local development section. Add:

```javascript
${config.includeAws ? `
## AWS local development

LocalStack runs all AWS services locally at http://localhost:4566
Start: docker compose up localstack -d
Setup: python scripts/create_local_resources.py
Test:  python scripts/invoke_local.py

AWS region: ${config.awsRegion || 'us-east-1'}
Services:   ${(config.awsServices || []).join(', ')}
Deploy:     ${config.awsDeploy || 'sam'}

Unit tests use moto — never real AWS, never LocalStack
Integration tests use LocalStack — docker compose up localstack -d first
Staging/production — real AWS, IAM roles, Secrets Manager
` : ''}
```

---

## TASK 3C — Add AWS to yooti.config.json template

In configTemplate(), add an aws section when config.includeAws is true:

```javascript
${config.includeAws ? `"aws": {
    "region":   "${config.awsRegion || 'us-east-1'}",
    "services": ${JSON.stringify(config.awsServices || [])},
    "deploy":   "${config.awsDeploy || 'sam'}",
    "localstack_url": "http://localhost:4566",
    "resources": {
      ${(config.awsServices || []).includes('dynamodb')
        ? `"dynamodb_table": "${config.projectName}",`  : ''}
      ${(config.awsServices || []).includes('sqs')
        ? `"sqs_queue":      "${config.projectName}-queue",
      "sqs_dlq":       "${config.projectName}-dlq",` : ''}
      ${(config.awsServices || []).includes('sns')
        ? `"sns_topic":      "${config.projectName}-topic",` : ''}
      ${(config.awsServices || []).includes('eventbridge')
        ? `"event_bus":      "${config.projectName}-bus",` : ''}
      ${(config.awsServices || []).includes('s3')
        ? `"s3_bucket":      "${config.projectName}-data"` : ''}
    }
  }` : ''}
```

---

## TASK 3D — Add AWS-GUIDE.md to the generated docs

Copy docs/AWS-GUIDE.md from the yooti-cli root into generated projects
as a project-specific version with correct names and services.

Add a template function awsGuideTemplate(config) that generates a
simplified project-specific version of docs/AWS-GUIDE.md with:
- The correct region from config.awsRegion
- The correct services from config.awsServices
- The correct resource names from config.projectName
- Links to scripts/create_local_resources.py and scripts/invoke_local.py

Write call in generateFiles():

```javascript
if (config.includeAws) {
  write('docs/AWS-GUIDE.md', awsGuideTemplate(config))
}
```

---

# SESSION 4 — Tests

After all sessions complete, verify everything works:

```bash
# Test full AWS project generation
node bin/yooti.js init test-aws \
  --type full \
  --context greenfield \
  --stack node,react,python \
  --no-git \
  --stage 3

# Simulate answering yes to AWS questions programmatically
# (or run interactively and select: yes, lambda+dynamodb+sqs, sam, us-east-1)

cd test-aws

# Verify all AWS files generated
echo "=== Checking generated files ==="
ls .claude/constitutions/aws.md        && echo "✓ aws.md constitution"
ls scripts/create_local_resources.py   && echo "✓ resource setup script"
ls scripts/invoke_local.py             && echo "✓ local invoke script"
ls events/api_post_valid.json          && echo "✓ test events"
ls events/api_post_invalid.json        && echo "✓ test events (invalid)"
ls events/sqs_batch.json               && echo "✓ SQS batch event"
ls template.yaml                       && echo "✓ SAM template"
ls .agent/templates/aws-lambda.json    && echo "✓ aws-lambda story template"
ls docs/AWS-GUIDE.md                   && echo "✓ AWS guide"

# Verify constitution content
grep 'mock_aws'           .claude/constitutions/aws.md && echo "✓ moto rules"
grep 'batchItemFailures'  .claude/constitutions/aws.md && echo "✓ SQS rules"
grep 'attribute_not_exists' .claude/constitutions/aws.md && echo "✓ DynamoDB idempotency"
grep 'Never use Scan'     .claude/constitutions/aws.md && echo "✓ no-Scan rule"
grep 'os.environ'         .claude/constitutions/aws.md && echo "✓ env var rule"

# Verify CLAUDE.md references aws.md
grep 'aws.md'             .claude/CLAUDE.md            && echo "✓ CLAUDE.md reference"

# Verify docker-compose has LocalStack
grep 'localstack'         docker-compose.yml           && echo "✓ LocalStack service"
grep '4566'               docker-compose.yml           && echo "✓ LocalStack port"

# Verify .gitignore
grep 'localstack-data'    .gitignore                   && echo "✓ gitignore"

# Verify .env.example
grep 'AWS_ENDPOINT_URL'   .env.example                 && echo "✓ env example"
grep 'TABLE_NAME'         .env.example                 && echo "✓ DynamoDB env"

# Verify SAM template is valid YAML
python3 -c "import yaml; yaml.safe_load(open('template.yaml'))" \
  && echo "✓ SAM template valid YAML"

# Verify story template is valid JSON
python3 -m json.tool .agent/templates/aws-lambda.json > /dev/null \
  && echo "✓ aws-lambda.json valid"

# Verify yooti.config.json has aws section
python3 -c "
import json
c = json.load(open('yooti.config.json'))
assert 'aws' in c, 'missing aws section'
assert 'region' in c['aws'], 'missing region'
print('✓ yooti.config.json aws section')
"

cd ..
rm -rf test-aws

# Test agent-only AWS project
node bin/yooti.js init test-aws-agent \
  --type agent \
  --context greenfield \
  --stack python \
  --no-git \
  --stage 3
# (select yes to AWS, lambda+dynamodb, sam, us-east-1)

ls test-aws-agent/.claude/constitutions/aws.md && echo "✓ aws.md for agent type"
rm -rf test-aws-agent

echo ""
echo "=== All AWS generation tests complete ==="
```

---

*Yooti AWS Build Prompts — v1.2*
