import { DataMapper } from "@aws/dynamodb-data-mapper/build/DataMapper";
import SitePreference from "./models/SitePreference";

export default class SitePreferenceRequest {
  dynamoDBMapper: DataMapper;
  static TAG = "[SitePreferenceRequest]: ";

  constructor(dynamoDBMapper: DataMapper) {
    this.dynamoDBMapper = dynamoDBMapper;
  }

  async getPreference(id: string): Promise<SitePreference> {
    try {
      return await this.dynamoDBMapper.get(
        Object.assign(new SitePreference(), {
          id: id
        })
      );
    } catch (e) {
      console.error(e);
      console.error(SitePreferenceRequest.TAG, "An error occurred", e);
      return null;
    }
  }

  async updatePreference(preference: SitePreference) {
    if (SitePreferenceRequest.verifyPreferenceObject(preference)) {
      let existingPreference = await this.getPreference(preference.id);
      if (existingPreference == null) {
        throw "SitePreference does not exist with the provided id";
      }
      for (let attr of Object.keys(preference)) {
        existingPreference[attr] = preference[attr];
      }
      return this.savePreference(existingPreference);
    }
  }

  async createPreference(preference: SitePreference) {
    preference.createdAt = Date.now();
    if (SitePreferenceRequest.verifyPreferenceObject(preference)) {
      return this.savePreference(preference);
    }
  }

  async savePreference(preference: SitePreference) {
    try {
      let objectSaved = await this.dynamoDBMapper.put(preference);
      console.log(
        SitePreferenceRequest.TAG,
        "SitePreference saved to DynamoDB",
        objectSaved
      );
      return objectSaved;
    } catch (e) {
      console.error(
        SitePreferenceRequest.TAG,
        "An error occurred saving SitePreference",
        preference,
        e
      );
      throw "An error occurred saving SitePreference";
    }
  }

  private static verifyPreferenceObject(preference: any): boolean {
    if (typeof preference !== "object") {
      throw "A preference must be an object";
    } else if (!preference.hasOwnProperty("id")) {
      throw "A preference must have an id";
    } else if (
      !preference.hasOwnProperty("value") &&
      !preference.hasOwnProperty("valueList")
    ) {
      throw "A preference must have a value or valueList attribute";
    }
    return true;
  }
}
