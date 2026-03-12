import { gql } from "graphql-tag";
import { TagName } from "../tagName/tagNameSchema";
import { TagStatus } from "../../types";

export const tagSchema = gql`
  type Tag {
    tagName: TagName!
    approvalStatus: TagStatus!
  }

  type Query {
    demonstrationTypes: [Tag!]!
    applicationTags: [Tag!]!
  }
`;

export type Tag = {
  tagName: TagName;
  approvalStatus: TagStatus;
};
