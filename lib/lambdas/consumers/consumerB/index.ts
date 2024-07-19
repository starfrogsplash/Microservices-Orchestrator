import * as AWS from "aws-sdk";

exports.handler = async (event: any) => {
  try {
    for (const record of event.Records) {
      const message = JSON.parse(record.body);
      console.log("Consumer B processing message:", message);
    }
    return {
      statusCode: 200,
      body: JSON.stringify("Message processed by Consumer B"),
    };
  } catch (error) {
    console.error("Error processing message:", error);
    return {
      statusCode: 500,
      body: JSON.stringify("An error occurred during message processing"),
    };
  }
};
