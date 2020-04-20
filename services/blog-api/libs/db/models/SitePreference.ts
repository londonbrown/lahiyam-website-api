import {
  attribute,
  hashKey,
  table
} from "@aws/dynamodb-data-mapper-annotations";

const stage = process.env.stage === "prod" ? "prod" : "dev";

@table(`${stage}-lahiyam-site-preferences-table`)
export default class SitePreference {
  @hashKey()
  id: string;

  @attribute({
    defaultProvider: () => Date.now()
  })
  createdAt?: number;

  @attribute()
  value?: any;

  @attribute()
  valueList?: Array<any>;
}
