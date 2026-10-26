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
] as const satisfies MockRenewal[];
