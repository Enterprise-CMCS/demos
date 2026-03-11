import { gql } from "graphql-tag";
import { Tag } from "../tag/tagSchema";
import { TagConfigurationStatus } from "../../types";

export const tagConfigurationSchema = gql`
  type TagConfiguration {
    tagId: Tag!
    approvalStatus: TagConfigurationStatus!
  }

  type Query {
    demonstrationTypes: [TagConfiguration!]!
    applicationTags: [TagConfiguration!]!
  }
`;

export type TagConfiguration = {
  tagId: Tag;
  approvalStatus: TagConfigurationStatus;
};
