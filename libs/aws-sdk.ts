import aws from "aws-sdk";
import xray from "aws-xray-sdk";
//console.log("\n\n\n\nPROCESS ENV", process, "\n\n\n\n");
const awsWrapped = process.env.IS_LOCAL ? aws : xray.captureAWS(aws);
export default awsWrapped;
