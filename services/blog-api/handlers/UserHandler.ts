import UserRequest, { User } from "../libs/db/UserRequest";
import DynamoDBMapper from "../libs/db/DynamoDBMapper";

import { APIGatewayProxyHandler } from "aws-lambda";
import "source-map-support/register";
import { Response, ResponseBuilder } from "./util/ResponseBuilder";
import ProdOrigins from "../libs/enum/ProdOrigins";
import DevOrigins from "../libs/enum/DevOrigins";

const userRequest = new UserRequest(DynamoDBMapper);

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
      queryEvent = await getUser(event);
      response = ResponseBuilder.successfulResponse(queryEvent)
        .withOrigin(allowedOrigin)
        .build();
    } else if (httpMethod.toLocaleUpperCase() === "POST") {
      const body = JSON.parse(event.body);
      queryEvent = await createUser(body);
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
    console.log(response.getResponseObject());
    return response.getResponseObject();
  } catch (e) {
    let response = ResponseBuilder.errorResponse(e)
      .withOrigin(allowedOrigin)
      .build();
    return response.getResponseObject();
  }
};

async function getUser(event): Promise<object> {
  if (event.queryStringParameters.hasOwnProperty("id")) {
    return userRequest.getUser(event.queryStringParameters.id);
  } else if (event.queryStringParameters.hasOwnProperty("username")) {
    return userRequest.getUserByUsername(event.queryStringParameters.username);
  } else {
    throw UserRequest.TAG + "GET /user expects an id or username parameter";
  }
}

async function createUser(body) {
  if (!body.hasOwnProperty("username")) {
    throw UserRequest.TAG +
      "POST /user Expected a username property in request";
  }
  const username = body.username;
  const user = new User();
  user.username = username;
  return userRequest.createUser(user);
}
