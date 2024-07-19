# AWS Microservices Orchestrator

## Overview

**AWS Microservices Orchestrator** is a serverless microservices architecture built using AWS Cloud Development Kit (CDK) in TypeScript. This project demonstrates the use of AWS Lambda, SNS, SQS, and CloudWatch for creating an event-driven system with multiple consumers and a single producer. It also showcases advanced features such as SNS message filtering and subscriptions to route messages to the appropriate SQS queues and consumer Lambdas.

## Architecture

- **SNS Topic**: Acts as the message broker with filtering policies.
- **SQS Queues**: Three separate queues for different message types.
- **SNS Subscriptions**: Subscriptions are set up with filters to ensure messages are routed to the correct SQS queues based on message attributes.
- **Lambda Functions**:
  - **Producer Lambda**: Publishes messages to the SNS topic.
  - **Consumer Lambdas**: Process messages from their respective SQS queues.
- **CloudWatch**: Monitors Lambda functions and sets alarms for errors.

## Prerequisites

- Node.js (>= 18.x)
- AWS CLI configured with appropriate permissions
- AWS CDK installed globally (`npm install -g aws-cdk`)

## Getting Started

### Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/starfrogsplash/aws-microservices-orchestrator.git
   cd aws-microservices-orchestrator
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

### Deployment

1. Bootstrap your CDK environment (if not already done):

   ```sh
   cdk bootstrap
   ```

2. Deploy the stack:

   ```sh
   cdk deploy
   ```

## Project Structure

```plaintext
microservices-app/
├── bin/
│   └── microservices-app.ts
├── lib/
│   └── microservices-app-stack.ts
├── lambda/
│   ├── producer/
│   │   └── index.ts
│   ├── consumerA/
│   │   └── index.ts
│   ├── consumerB/
│   │   └── index.ts
│   └── consumerC/
│       └── index.ts
├── cdk.json
├── package.json
├── tsconfig.json
└── README.md
```

## Manual Testing

Publish Test Messages
Use the AWS CLI to publish messages to the SNS topic with appropriate message attributes:

```sh
    # Publish a message for Consumer A
    aws sns publish --topic-arn <your-sns-topic-arn> --message '{"data":"Message for typeA"}' --message-attributes '{"eventType":{"DataType":"String","StringValue":"typeA"}}'

    # Publish a message for Consumer B
    aws sns publish --topic-arn <your-sns-topic-arn> --message '{"data":"Message for typeB"}' --message-attributes '{"eventType":{"DataType":"String","StringValue":"typeB"}}'

    # Publish a message for Consumer C
    aws sns publish --topic-arn <your-sns-topic-arn> --message '{"data":"Message for typeC"}' --message-attributes '{"eventType":{"DataType":"String","StringValue":"typeC"}}'
```

## Check CloudWatch Logs

Verify that the Lambda functions processed the messages by checking the CloudWatch logs:

```sh
  aws logs describe-log-streams --log-group-name /aws/lambda/ConsumerFunctionA
  aws logs get-log-events --log-group-name /aws/lambda/ConsumerFunctionA --log-stream-name <log-stream-name>
```

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `npx cdk deploy` deploy this stack to your default AWS account/region
- `npx cdk diff` compare deployed stack with current state
- `npx cdk synth` emits the synthesized CloudFormation template
