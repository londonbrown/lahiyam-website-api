import AWS from "../../../../libs/aws-sdk";

export default new AWS.S3({
  region: process.env.AWS_REGION || "us-west-2"
});
