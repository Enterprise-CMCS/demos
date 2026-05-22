import { gql } from "graphql-tag";
import { TagName } from "../../types";

export const applicationTagAssignmentSchema = gql`
  input SetApplicationTagsInput {
    applicationId: ID!
    applicationTags: [TagName!]!
  }

  type Mutation {
    setApplicationTags(input: SetApplicationTagsInput!): Application!
      @auth(requires: ["Perform CMS Action"])
  }
`;

export interface SetApplicationTagsInput {
  applicationId: string;
  applicationTags: TagName[];
}
