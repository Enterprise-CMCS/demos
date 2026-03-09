import { gql } from "graphql-tag";
import { Tag } from "../../types";

export const applicationTagAssignmentSchema = gql`
  input SetApplicationTagsInput {
    applicationId: ID!
    applicationTags: [Tag!]!
  }

  type Mutation {
    setApplicationTags(input: SetApplicationTagsInput): Application
      @auth(permissions: ["Manage Application Workflow"])
  }
`;

export interface SetApplicationTagsInput {
  applicationId: string;
  applicationTags: Tag[];
}
