import { Amendment } from "demos-server";

export type MockAmendment = Pick<
  Amendment,
  "id" | "name" | "effectiveDate" | "effectivePlainDate" | "createdAt" | "status"
>;

export const mockAmendments = [
  {
    id: "1",
    name: "Amendment 1 - Montana Medicaid Waiver",
    effectiveDate: new Date(2025, 0, 1),
    effectivePlainDate: "2025-01-01",
    status: "Under Review",
    createdAt: new Date(2024, 4, 30),
  },
  {
    id: "2",
    name: "Amendment 2 - Montana Medicaid Waiver",
    effectiveDate: new Date(2025, 1, 1),
    effectivePlainDate: "2025-02-01",
    status: "Approved",
    createdAt: new Date(2024, 5, 15),
  },
  {
    id: "3",
    name: "Amendment 3 - Montana Medicaid Waiver",
    effectiveDate: new Date(2025, 2, 1),
    effectivePlainDate: "2025-03-01",
    status: "Approved",
    createdAt: new Date(2024, 5, 20),
  },
  {
    id: "4",
    name: "Amendment 4 - Florida Health Innovation",
    effectiveDate: new Date(2025, 3, 1),
    effectivePlainDate: "2025-04-01",
    status: "Under Review",
    createdAt: new Date(2024, 6, 1),
  },
  {
    id: "5",
    name: "Amendment 5 - Florida Health Innovation",
    effectiveDate: new Date(2025, 4, 1),
    effectivePlainDate: "2025-05-01",
    status: "Denied",
    createdAt: new Date(2024, 6, 15),
  },
  {
    id: "6",
    name: "Amendment 6 - Florida Health Innovation",
    effectiveDate: undefined,
    effectivePlainDate: undefined,
    status: "Denied",
    createdAt: new Date(2024, 6, 20),
  },
] as const satisfies MockAmendment[];
