import {
  attribute,
  hashKey,
  table
} from "@aws/dynamodb-data-mapper-annotations";

const stage = process.env.stage === "prod" ? "prod" : "dev";

@table(`${stage}-lahiyam-users-table`)
export default class User {
  @hashKey()
  id: string;

  @attribute({
    indexKeyConfigurations: {
      "username-index": "HASH"
    }
  })
  username: string;

  @attribute({ defaultProvider: () => Date.now() })
  createdAt?: number;
}
