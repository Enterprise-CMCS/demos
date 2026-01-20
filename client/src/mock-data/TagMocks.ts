import { MockedResponse } from "@apollo/client/testing";
import { SELECT_DEMONSTRATION_TYPE_TAG_QUERY } from "components/input/select/SelectTag/SelectDemonstrationTypeTag";

export type Tag = string;

export const MOCK_TAGS: Tag[] = [
  "Aggregate Cap",
  "Annual Limits",
  "Basic Health Plan (BHP)",
  "Behavioral Health",
  "Beneficiary Engagement",
  "Children's Health Insurance Program (CHIP)",
  "CMMI - AHEAD",
  "CMMI - Integrated Care for Kids (IncK)",
];

export const tagMocks: MockedResponse[] = [
  {
    request: {
      query: SELECT_DEMONSTRATION_TYPE_TAG_QUERY,
    },
    // error: new Error("Failed to fetch demonstration type tags"),
    result: {
      data: {
        demonstrationTypeTags: MOCK_TAGS,
      },
    },
    delay: 3000,
  },
];
