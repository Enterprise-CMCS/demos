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

export const MOCK_MEDICAID_TRANSFORMATION: DemonstrationTypeUsageSummary = {
  ...MOCK_1115_WAIVER,
  demonstrationTypeName: "Medicaid Transformation",
  approvalStatus: "Approved",
};

export const MOCK_DELIVERY_SYSTEM_REFORM: DemonstrationTypeUsageSummary = {
  ...MOCK_1115_WAIVER,
  demonstrationTypeName: "Delivery System Reform",
  approvalStatus: "Unapproved",
};

export const MOCK_HEALTH_INNOVATION: DemonstrationTypeUsageSummary = {
  ...MOCK_1115_WAIVER,
  demonstrationTypeName: "Health Innovation Initiative",
  approvalStatus: "Approved",
};

export const MOCK_DEMONSTRATION_TYPE_USAGE: DemonstrationTypeUsageSummary[] = [
  MOCK_1115_WAIVER,
  MOCK_MEDICAID_TRANSFORMATION,
  MOCK_DELIVERY_SYSTEM_REFORM,
  MOCK_HEALTH_INNOVATION,
  {
    ...MOCK_1115_WAIVER,
    demonstrationTypeName: MOCK_TAGS[1].tagName,
    approvalStatus: MOCK_TAGS[1].approvalStatus,
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
