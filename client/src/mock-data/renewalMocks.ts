import { Extension as Renewal } from "demos-server";

export type MockRenewal = Pick<
  Renewal,
  "id" | "name" | "effectivePlainDate" | "createdAt" | "status"
>;

export const mockRenewals = [
  {
    id: "1",
    name: "Renewal 1 - Montana Medicaid Waiver",
    effectivePlainDate: "2025-01-01",
    status: "Under Review",
    createdAt: new Date(2024, 5, 1),
  },
  {
    id: "2",
    name: "Renewal 2 - Montana Medicaid Waiver",
    effectivePlainDate: "2025-02-01",
    status: "Approved",
    createdAt: new Date(2024, 5, 3),
  },
  {
    id: "3",
    name: "Renewal 3 - Montana Medicaid Waiver",
    effectivePlainDate: undefined,
    status: "Approved",
    createdAt: new Date(2024, 5, 2),
  },
] as const satisfies MockRenewal[];
