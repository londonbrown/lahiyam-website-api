import AWS from "../../../../libs/aws-sdk";
export default new AWS.DynamoDB({
  region: process.env.AWS_REGION || "us-west-2"
});
