import { APIGatewayProxyHandler } from "aws-lambda";
import ProdOrigins from "../libs/enum/ProdOrigins";
import DevOrigins from "../libs/enum/DevOrigins";
import { Response, ResponseBuilder } from "./util/ResponseBuilder";
import SitePreference from "../libs/db/models/SitePreference";
import DynamoDBMapper from "../libs/db/DynamoDBMapper";
import SitePreferenceRequest from "../libs/db/SitePreferenceRequest";

const sitePreferenceRequest = new SitePreferenceRequest(DynamoDBMapper);
export const index: APIGatewayProxyHandler = async (event, _context) => {
  const allowedOrigin =
    process.env.stage === "prod"
      ? ProdOrigins.API
      : DevOrigins.getAllowedOriginFromEvent(event);
  try {
    const { httpMethod } = event;
    let queryEvent;
    let response: Response;

    if (httpMethod.toLocaleUpperCase() === "GET") {
      if (event.queryStringParameters) {
        const { queryStringParameters } = event;
        if (queryStringParameters.id) {
          queryEvent = await getPreference(event);
          response = ResponseBuilder.successfulResponse(queryEvent)
            .withOrigin(allowedOrigin)
            .build();
        }
      }
    } else if (httpMethod.toLocaleUpperCase() === "PUT") {
      const body = JSON.parse(event.body);
      queryEvent = await updatePreference(body);
      response = ResponseBuilder.successfulResponse(queryEvent)
        .withOrigin(allowedOrigin)
        .build();
    } else if (httpMethod.toLocaleUpperCase() === "POST") {
      const body = JSON.parse(event.body);
      queryEvent = await createPreference(body);
      response = ResponseBuilder.successfulResponse(queryEvent)
        .withOrigin(allowedOrigin)
        .build();
    } else {
      response = ResponseBuilder.errorResponse({
        message:
          "Invalid request type. Acceptable requests are GET, POST, and PUT"
      })
        .withOrigin(allowedOrigin)
        .build();
    }
    return response.getResponseObject();
  } catch (e) {
    console.error(e);
    let response = ResponseBuilder.errorResponse(e)
      .withOrigin(allowedOrigin)
      .build();
    return response.getResponseObject();
  }
};

async function getPreference(event): Promise<SitePreference> {
  if (event.queryStringParameters.hasOwnProperty("id")) {
    return sitePreferenceRequest.getPreference(event.queryStringParameters.id);
  } else {
    throw SitePreferenceRequest.TAG + "GET /preference expects an id parameter";
  }
}

async function updatePreference(body) {
  if (!body.hasOwnProperty("id")) {
    throw Error("POST /preference id attribute not specified in request");
  } else if (
    !body.hasOwnProperty("value") &&
    !body.hasOwnProperty("valueList")
  ) {
    throw Error("POST /preference must have a value or valueList attribute");
  }
  const preference = new SitePreference();
  for (let attr of Object.keys(body)) {
    preference[attr] = body[attr];
  }
  return sitePreferenceRequest.updatePreference(preference);
}

async function createPreference(body) {
  if (!body.hasOwnProperty("id")) {
    throw Error("POST /preference id attribute not specified in request");
  } else if (
    !body.hasOwnProperty("value") &&
    !body.hasOwnProperty("valueList")
  ) {
    throw Error("POST /preference must have a value or valueList attribute");
  }
  const preference = new SitePreference();
  for (let attr of Object.keys(body)) {
    preference[attr] = body[attr];
  }
  return sitePreferenceRequest.createPreference(preference);
}
