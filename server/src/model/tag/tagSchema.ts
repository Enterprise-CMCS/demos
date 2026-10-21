import { gql } from "graphql-tag";
import type {
  Amendment,
  Deliverable,
  Demonstration,
  Extension,
  Reference,
  TagName,
  TagStatus,
} from "../../types";

export const tagSchema = gql`
  type Tag {
    tagName: TagName!
    approvalStatus: TagStatus!
  }

  type TagDetail {
    tagName: TagName!
    approvalStatus: TagStatus!
    taggedDemonstrations: [Demonstration!]!
    taggedAmendments: [Amendment!]!
    taggedRenewals: [Extension!]!
    taggedReferences: [Reference!]!
    assignedDemonstrations: [Demonstration!]!
    assignedDeliverables: [Deliverable!]!
  }

  type DemonstrationTypeUsageTaggedApplicationCounts {
    demonstrations: Int!
    amendments: Int!
    renewals: Int!
  }

  type DemonstrationTypeUsageSummary {
    demonstrationTypeName: TagName!
    approvalStatus: TagStatus!
    countOfTaggedApplications: DemonstrationTypeUsageTaggedApplicationCounts!
    countOfTaggedReferences: Int!
    countOfAssignedDemonstrations: Int!
    countOfAssignedDeliverables: Int!
  }

  type Query {
    demonstrationTypeOptions: [Tag!]!
    applicationTagOptions: [Tag!]!
    demonstrationTypeUsageSummary: [DemonstrationTypeUsageSummary!]!
      @auth(requires: ["Access Admin Query"])
    tagDetails(tagName: TagName!): TagDetail! @auth(requires: ["Access Admin Query"])
  }

  type Mutation {
    createTags(tagNames: [TagName!]!): [Tag!]! @auth(requires: ["Perform Admin Action"])
    approveTags(tagNames: [TagName!]!): [Tag!]! @auth(requires: ["Perform Admin Action"])
    deleteTags(tagNames: [TagName!]!): Int! @auth(requires: ["Perform Admin Action"])
  }
`;

export interface Tag {
  tagName: TagName;
  approvalStatus: TagStatus;
}

export interface TagDetail {
  tagName: TagName;
  approvalStatus: TagStatus;
  taggedDemonstrations: Demonstration[];
  taggedAmendments: Amendment[];
  taggedRenewals: Extension[];
  taggedReferences: Reference[];
  assignedDemonstrations: Demonstration[];
  assignedDeliverables: Deliverable[];
}

type DemonstrationTypeUsageTaggedApplicationCounts = {
  demonstrations: number;
  amendments: number;
  renewals: number;
};

export interface DemonstrationTypeUsageSummary {
  demonstrationTypeName: TagName;
  approvalStatus: TagStatus;
  countOfTaggedApplications: DemonstrationTypeUsageTaggedApplicationCounts;
  countOfTaggedReferences: number;
  countOfAssignedDemonstrations: number;
  countOfAssignedDeliverables: number;
}
