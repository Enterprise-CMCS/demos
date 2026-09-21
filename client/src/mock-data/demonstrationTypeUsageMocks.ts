import { DemonstrationTypeUsageSummary } from "demos-server";

export const MOCK_1115_WAIVER: DemonstrationTypeUsageSummary = {
  demonstrationTypeName: "1115 Waiver",
  approvalStatus: "Approved",
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
    demonstrationTypeName: "Managed Care",
  },
  {
    ...MOCK_1115_WAIVER,
    demonstrationTypeName: "CHIP",
    approvalStatus: "Unapproved",
  },
  {
    ...MOCK_1115_WAIVER,
    demonstrationTypeName: "Medicaid Expansion",
  },
  {
    ...MOCK_1115_WAIVER,
    demonstrationTypeName: "Pharmacy",
  },
];
