import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const sns = new SNSClient({});

exports.handler = async (event: any) => {
  // Send message to SNS topic
  const params = {
    Message: JSON.stringify(event),
    TopicArn: process.env.TOPIC_ARN,
  };

  try {
    // Publish the message to the SNS topic
    const res = await sns.send(new PublishCommand(params));
    console.log("Message sent to SNS topic:", res);
    return {
      statusCode: 200,
      body: JSON.stringify("Message sent to SNS topic successfully."),
    };
  } catch (error) {
    console.error("Error sending message to SNS topic:", error);
    return {
      statusCode: 500,
      body: JSON.stringify("Failed to send message to SNS topic."),
    };
  }
};
