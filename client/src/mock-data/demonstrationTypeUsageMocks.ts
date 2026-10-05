import { DemonstrationTypeUsageSummary } from "demos-server";
import { MOCK_TAGS } from "./TagMocks";

export const MOCK_1115_WAIVER: DemonstrationTypeUsageSummary = {
  demonstrationTypeName: MOCK_TAGS[0].tagName,
  approvalStatus: MOCK_TAGS[0].approvalStatus,
  countOfTaggedApplications: {
    demonstrations: 4,
    amendments: 3,
    renewals: 6,
  },
  countOfAssignedDemonstrations: 12,
  countOfAssignedDeliverables: 7,
};

export const MOCK_DEMONSTRATION_TYPE_USAGE: DemonstrationTypeUsageSummary[] = [
  MOCK_1115_WAIVER,
  {
    ...MOCK_1115_WAIVER,
    demonstrationTypeName: MOCK_TAGS[1].tagName,
    approvalStatus: MOCK_TAGS[1].approvalStatus,
    countOfTaggedApplications: {
      demonstrations: 0,
      amendments: 0,
      renewals: 0,
    },
    countOfAssignedDemonstrations: 0,
    countOfAssignedDeliverables: 0,
  },
  {
    ...MOCK_1115_WAIVER,
    demonstrationTypeName: MOCK_TAGS[2].tagName,
    approvalStatus: MOCK_TAGS[2].approvalStatus,
  },
  {
    ...MOCK_1115_WAIVER,
    demonstrationTypeName: MOCK_TAGS[3].tagName,
    approvalStatus: MOCK_TAGS[3].approvalStatus,
  },
  {
    ...MOCK_1115_WAIVER,
    demonstrationTypeName: MOCK_TAGS[4].tagName,
    approvalStatus: MOCK_TAGS[4].approvalStatus,
  },
];
