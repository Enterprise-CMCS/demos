import { gql } from "graphql-tag";
import { TagStatus, TagName } from "../../types";

export const tagSchema = gql`
  type Tag {
    tagName: TagName!
    approvalStatus: TagStatus!
  }

  type Query {
    demonstrationTypeOptions: [Tag!]!
    applicationTagOptions: [Tag!]!
  }
`;

export type Tag = {
  tagName: TagName;
  approvalStatus: TagStatus;
};
