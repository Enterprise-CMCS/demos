import { gql } from "graphql-tag";
import { TagStatus, TagName } from "../../types";

export const tagSchema = gql`
  type Tag {
    tagName: TagName! @auth(requires: "Resolve Tag")
    approvalStatus: TagStatus! @auth(requires: "Resolve Tag")
  }

  type Query {
    demonstrationTypeOptions: [Tag!]! @auth(requires: "Query Tag Options")
    applicationTagOptions: [Tag!]! @auth(requires: "Query Tag Options")
  }
`;

export type Tag = {
  tagName: TagName;
  approvalStatus: TagStatus;
};
