import { Tag } from "./TagMocks";

export type DemonstrationType = {
  tag: Tag;
  effectiveDate: string;
  expirationDate: string;
};

export const MOCK_DEMONSTRATION_TYPES: DemonstrationType[] = [
  {
    tag: "Aggregate Cap",
    effectiveDate: "2025-01-01",
    expirationDate: "2025-12-31",
  },
  {
    tag: "Annual Limits",
    effectiveDate: "2025-02-01",
    expirationDate: "2025-11-30",
  },
  {
    tag: "Basic Health Plan (BHP)",
    effectiveDate: "2025-03-01",
    expirationDate: "2025-10-31",
  },
];
