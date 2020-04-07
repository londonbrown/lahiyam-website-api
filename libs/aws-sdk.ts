import * as aws from "aws-sdk";
import * as xray from "aws-xray-sdk";

const awsWrapped = process.env.IS_LOCAL ? aws : xray.captureAWS(aws);

export default awsWrapped;
