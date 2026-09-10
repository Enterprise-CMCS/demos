import { gql } from "graphql-tag";
import { TagStatus, TagName } from "../../types";

export const tagSchema = gql`
  type Tag {
    tagName: TagName!
    approvalStatus: TagStatus!
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
    countOfAssignedDemonstrations: Int!
    countOfAssignedDeliverables: Int!
  }

  type Query {
    demonstrationTypeOptions: [Tag!]!
    applicationTagOptions: [Tag!]!
    demonstrationTypeUsageSummary: [DemonstrationTypeUsageSummary!]!
  }
`;

export interface Tag {
  tagName: TagName;
  approvalStatus: TagStatus;
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
  countOfAssignedDemonstrations: number;
  countOfAssignedDeliverables: number;
}
