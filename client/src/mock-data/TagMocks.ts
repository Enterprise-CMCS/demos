import { MockedResponse } from "@apollo/client/testing";
import { SELECT_DEMONSTRATION_TYPE_QUERY } from "components/input/select/SelectDemonstrationType";
import { Tag } from "demos-server";

export const MOCK_TAGS: Tag[] = [
  { tagName: "Aggregate Cap", approvalStatus: "Approved" },
  { tagName: "Annual Limits", approvalStatus: "Unapproved" },
  { tagName: "Basic Health Plan (BHP)", approvalStatus: "Approved" },
  { tagName: "Behavioral Health", approvalStatus: "Approved" },
  { tagName: "Beneficiary Engagement", approvalStatus: "Unapproved" },
  { tagName: "Children's Health Insurance Program (CHIP)", approvalStatus: "Approved" },
  { tagName: "CMMI - AHEAD", approvalStatus: "Unapproved" },
  { tagName: "CMMI - Integrated Care for Kids (IncK)", approvalStatus: "Approved" },
];

export const tagMocks: MockedResponse[] = [
  {
    request: {
      query: SELECT_DEMONSTRATION_TYPE_QUERY,
    },
    result: {
      data: {
        demonstrationTypes: MOCK_TAGS,
      },
    },
  },
];
