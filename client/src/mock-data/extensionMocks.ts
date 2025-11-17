import { Extension } from "demos-server";

export type MockExtension = Pick<
  Extension,
  "id" | "name" | "effectiveDate" | "createdAt" | "status"
>;

export const mockExtensions = [
  {
    id: "1",
    name: "Extension 1 - Montana Medicaid Waiver",
    effectiveDate: new Date(2025, 0, 1),
    status: "Under Review",
    createdAt: new Date(2024, 5, 1),
  },
  {
    id: "2",
    name: "Extension 2 - Montana Medicaid Waiver",
    effectiveDate: new Date(2025, 1, 1),
    status: "Approved",
    createdAt: new Date(2024, 5, 3),
  },
  {
    id: "3",
    name: "Extension 3 - Montana Medicaid Waiver",
    effectiveDate: undefined,
    status: "Approved",
    createdAt: new Date(2024, 5, 2),
  },
] as const satisfies MockExtension[];
