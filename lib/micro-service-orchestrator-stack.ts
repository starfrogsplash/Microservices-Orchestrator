import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as cloudwatch_actions from "aws-cdk-lib/aws-cloudwatch-actions";
import * as lambda_event_sources from "aws-cdk-lib/aws-lambda-event-sources";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

export class MicroServiceOrchestratorStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // SNS Topic
    const topic = new sns.Topic(this, "MicroServiceOrchestratorTopic", {
      displayName: "MicroServiceOrchestratorTopic",
      topicName: "MicroServiceOrchestratorTopic",
    });

    // Dead Letter Queue
    const dlq = new sqs.Queue(this, "DeadLetterQueue", {
      queueName: "DeadLetterQueue",
    });

    // SQS Queues
    const queueA = new sqs.Queue(this, "QueueA", {
      queueName: "QueueA",
      deadLetterQueue: {
        maxReceiveCount: 2,
        queue: dlq,
      },
    });

    const queueB = new sqs.Queue(this, "QueueB", {
      queueName: "QueueB",
    });
    const queueC = new sqs.Queue(this, "QueueC", {
      queueName: "QueueC",
    });

    // SNS Subscription with Filters
    topic.addSubscription(
      new subscriptions.SqsSubscription(queueA, {
        filterPolicy: {
          eventType: sns.SubscriptionFilter.stringFilter({
            allowlist: ["typeA"],
          }),
        },
      })
    );

    topic.addSubscription(
      new subscriptions.SqsSubscription(queueB, {
        filterPolicy: {
          eventType: sns.SubscriptionFilter.stringFilter({
            allowlist: ["typeB"],
          }),
        },
      })
    );

    topic.addSubscription(
      new subscriptions.SqsSubscription(queueC, {
        filterPolicy: {
          eventType: sns.SubscriptionFilter.stringFilter({
            allowlist: ["typeC"],
          }),
        },
      })
    );

    const producerLambda = new NodejsFunction(this, "ProducerFunction", {
      functionName: "Producer",
      entry: "./lib/lambdas/producer/index.ts",
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: {
        TOPIC_ARN: topic.topicArn,
      },
      tracing: lambda.Tracing.ACTIVE,
    });

    // Grant Permissions to Producer Lambda
    topic.grantPublish(producerLambda);

    // Consumer Lambda Functions
    const consumerFunctionRole = new iam.Role(this, "ConsumerFunctionRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AWSXRayDaemonWriteAccess"),
      ],
    });

    const consumerLambdaA = new NodejsFunction(this, "ConsumerA", {
      functionName: "ConsumerA",
      entry: "./lib/lambdas/consumers/consumerA/index.ts",
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: {
        QUEUE_URL: queueA.queueUrl,
      },
      role: consumerFunctionRole,
      tracing: lambda.Tracing.ACTIVE,
    });

    const consumerLambdaB = new NodejsFunction(this, "ConsumerB", {
      functionName: "ConsumerB",
      entry: "./lib/lambdas/consumers/consumerB/index.ts",
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: {
        QUEUE_URL: queueB.queueUrl,
      },
      role: consumerFunctionRole,
      tracing: lambda.Tracing.ACTIVE,
    });

    const consumerLambdaC = new NodejsFunction(this, "ConsumerC", {
      functionName: "ConsumerC",
      entry: "./lib/lambdas/consumers/consumerC/index.ts",
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: {
        QUEUE_URL: queueC.queueUrl,
      },
      role: consumerFunctionRole,
      tracing: lambda.Tracing.ACTIVE,
    });

    // Grant permissions for the consumer Lambdas to read from the SQS queues
    queueA.grantConsumeMessages(consumerLambdaA);
    queueB.grantConsumeMessages(consumerLambdaB);
    queueC.grantConsumeMessages(consumerLambdaC);

    // Add SQS event sources to the consumer Lambdas
    consumerLambdaA.addEventSource(
      new lambda_event_sources.SqsEventSource(queueA)
    );
    consumerLambdaB.addEventSource(
      new lambda_event_sources.SqsEventSource(queueB)
    );
    consumerLambdaC.addEventSource(
      new lambda_event_sources.SqsEventSource(queueC)
    );

    // CloudWatch Alarms for Consumers
    const errorAlarmA = new cloudwatch.Alarm(this, "LambdaErrorAlarmA", {
      metric: consumerLambdaA.metricErrors(),
      threshold: 1,
      evaluationPeriods: 1,
    });
    const errorAlarmB = new cloudwatch.Alarm(this, "LambdaErrorAlarmB", {
      metric: consumerLambdaB.metricErrors(),
      threshold: 1,
      evaluationPeriods: 1,
    });
    const errorAlarmC = new cloudwatch.Alarm(this, "LambdaErrorAlarmC", {
      metric: consumerLambdaC.metricErrors(),
      threshold: 1,
      evaluationPeriods: 1,
    });

    const alarmTopic = new sns.Topic(this, "AlarmTopic");
    errorAlarmA.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));
    errorAlarmB.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));
    errorAlarmC.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    new cdk.CfnOutput(this, "topic arn 👉", { value: `${topic.topicArn}` });
    new cdk.CfnOutput(this, "Queue A url 👉", { value: `${queueA.queueUrl}` });
  }
}
