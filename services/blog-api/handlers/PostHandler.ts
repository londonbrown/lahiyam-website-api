import PostRequest, { Post } from "../libs/db/PostRequest";
import DynamoDBMapper from "../libs/db/DynamoDBMapper";
import S3Client from "../libs/clients/S3Client";
import S3ImageManager from "./util/S3ImageManager";

import { APIGatewayProxyHandler } from "aws-lambda";
import "source-map-support/register";
import { Response, ResponseBuilder } from "./util/ResponseBuilder";

const postRequest = new PostRequest(DynamoDBMapper);
const s3ImageManager = new S3ImageManager(S3Client);
export const index: APIGatewayProxyHandler = async (event, _context) => {
  try {
    const { httpMethod } = event;
    let queryEvent;
    let response: Response;
    if (httpMethod.toLocaleUpperCase() === "GET") {
      if (event.queryStringParameters) {
        const { queryStringParameters } = event;
        if (queryStringParameters.id || queryStringParameters.userId) {
          queryEvent = await getPost(event);
          response = ResponseBuilder.successfulResponse(queryEvent);
        }
      }
    } else if (httpMethod.toLocaleUpperCase() === "PUT") {
      const body = JSON.parse(event.body);
      queryEvent = await updatePost(body);
      response = ResponseBuilder.successfulResponse(queryEvent);
    } else if (httpMethod.toLocaleUpperCase() === "POST") {
      const body = JSON.parse(event.body);
      queryEvent = await createPost(body);
      response = ResponseBuilder.successfulResponse(queryEvent);
    } else {
      response = ResponseBuilder.errorResponse({
        message:
          "Invalid request type. Acceptable requests are GET, POST, PUT, and DELETE"
      });
    }
    return response.getResponseObject();
  } catch (e) {
    console.error(e);
    let response = ResponseBuilder.errorResponse(e);
    return response.getResponseObject();
  }
};

async function getPost(event): Promise<any> {
  if (event.queryStringParameters.hasOwnProperty("id")) {
    return postRequest.getPost(event.queryStringParameters.id);
  } else if (event.queryStringParameters.hasOwnProperty("userId")) {
    return postRequest.getPostsByUser(
      event.queryStringParameters.userId,
      event.queryStringParameters.createdAt
    );
  } else {
    throw PostRequest.TAG + "GET /post expects an id or userId parameter";
  }
}

async function updatePost(body) {
  if (!body.hasOwnProperty("userId")) {
    throw Error("POST /post userId attribute not specified in request");
  } else if (!body.hasOwnProperty("title")) {
    throw Error("POST /post title attribute not specified in request");
  } else if (!body.hasOwnProperty("content")) {
    throw Error("POST /post content attribute not specified in request");
  }
  const post = new Post();
  for (let attr of Object.keys(body)) {
    console.log(typeof body[attr]);
    post[attr] = body[attr];
  }
  return postRequest.updatePost(post);
}

async function createPost(body) {
  if (!body.hasOwnProperty("userId")) {
    throw Error("POST /post userId attribute not specified in request");
  } else if (!body.hasOwnProperty("title")) {
    throw Error("POST /post title attribute not specified in request");
  } else if (!body.hasOwnProperty("content")) {
    throw Error("POST /post content attribute not specified in request");
  }
  const post = new Post();
  post.userId = body.userId;
  post.title = body.title;
  post.content = body.content;
  post.tags = body.tags;
  post.createdAt = body.createdAt;
  // check for and upload photos to s3, then replace image links.
  // or just return original content if not photos
  post.content = await uploadPhotosFromPost(post);
  return postRequest.createPost(post);
}

async function uploadPhotosFromPost(post: Post) {
  if (typeof post.content === "object") {
    const content = JSON.parse(post.content);
    content.ops = content.ops.map(op => {
      if (op.hasOwnProperty("insert") && op.insert.hasOwnProperty("image")) {
        op.insert.image =
          "//bucket.com/" +
          s3ImageManager.uploadImageFromBase64String(op.insert.image);
      }
      return op;
    });
    post.content = JSON.stringify(content);
  }
  return post.content;
}
