import { DataMapper } from "@aws/dynamodb-data-mapper/build/DataMapper";
import { lessThanOrEqualTo } from "@aws/dynamodb-expressions";
import Post from "../db/models/Post";

const uuid = require("uuid/v4");

export default class PostRequest {
  dynamoDBMapper: DataMapper;
  static TAG = "[PostRequest]: ";

  constructor(dynamoDBMapper: DataMapper) {
    this.dynamoDBMapper = dynamoDBMapper;
  }

  async getPost(id: string): Promise<Post> {
    try {
      let post = await this.dynamoDBMapper.get(
        Object.assign(new Post(), {
          id: id
        })
      );
      if (post.tags) {
        post.tags = Array.from(post.tags);
      }
      return post;
    } catch (e) {
      console.error(e);
      console.error(PostRequest.TAG, "An error occurred", e);
      return null;
    }
  }

  async getPostsByUser(params: {
    userId: string;
    createdAt?: number;
    startKey?: string;
  }): Promise<{
    posts: Post[];
    lastEvaluatedKey: Partial<Post>;
  }> {
    let { userId, createdAt, startKey } = params;
    let lastEvaluatedKey;
    try {
      if (startKey) {
        lastEvaluatedKey = JSON.parse(startKey);
      }
    } catch (e) {
      console.error(e);
    }
    createdAt = createdAt || Date.now();
    try {
      let queryPaginator = this.dynamoDBMapper
        .query(
          Post,
          {
            userId: userId,
            createdAt: lessThanOrEqualTo(createdAt)
          },
          {
            indexName: "userId-createdAt-index",
            scanIndexForward: false,
            limit: 10,
            startKey: lastEvaluatedKey
          }
        )
        .pages();
      let posts = (await queryPaginator.next()).value;
      return {
        posts: posts,
        lastEvaluatedKey: queryPaginator.lastEvaluatedKey
      };
    } catch (e) {
      console.error(PostRequest.TAG, "An error occurred", e);
      return null;
    }
  }

  private static verifyPostObject(post: Post): boolean {
    if (!post.userId) {
      throw "A Post object must have a userId attribute";
    }
    if (!post.title) {
      throw "A Post object must have a title attribute";
    }
    if (!post.content) {
      throw "A Post object must have a content attribute";
    }
    if (!post.id) {
      throw "A Post object must have an id attribute";
    }
    return true;
  }

  async updatePost(post: Post) {
    if (PostRequest.verifyPostObject(post)) {
      let existingPost = await this.getPost(post.id);
      if (existingPost == null) {
        throw "Post does not exist with provided id";
      }
      if (existingPost.userId !== post.userId) {
        throw "New Post object has a different userId than the original Post";
      }
      for (let attr of Object.keys(post)) {
        existingPost[attr] = post[attr];
        console.log(typeof existingPost[attr]);
        console.log(typeof post[attr]);
      }
      console.log(existingPost);
      return this.savePost(existingPost);
    }
  }

  async createPost(post: Post) {
    post.id = uuid();
    post.createdAt = Date.now();
    if (PostRequest.verifyPostObject(post)) {
      return this.savePost(post);
    }
  }

  async savePost(post: Post) {
    try {
      let objectSaved = await this.dynamoDBMapper.put(post);
      console.log(PostRequest.TAG, "Post saved to DynamoDB", objectSaved);
      return objectSaved;
    } catch (e) {
      console.error(PostRequest.TAG, "An error occurred saving Post", post, e);
      throw "An error occurred saving Post";
    }
  }
}
export { Post };
