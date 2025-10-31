import type { ApplicationStatus } from "demos-server";
import { Amendment } from "demos-server";

export type MockAmendment = Pick<Amendment, "id" | "name" | "effectiveDate"> & {
  status: ApplicationStatus;
};

export const mockAmendments = [
  {
    id: "1",
    name: "Amendment 1 - Montana Medicaid Waiver",
    effectiveDate: new Date(2025, 0, 1),
    status: "Under Review",
  },
  {
    id: "2",
    name: "Amendment 2 - Montana Medicaid Waiver",
    effectiveDate: new Date(2025, 1, 1),
    status: "Approved",
  },
  {
    id: "3",
    name: "Amendment 3 - Montana Medicaid Waiver",
    effectiveDate: new Date(2025, 2, 1),
    status: "Approved",
  },
  {
    id: "4",
    name: "Amendment 4 - Florida Health Innovation",
    effectiveDate: new Date(2025, 3, 1),
    status: "Under Review",
  },
  {
    id: "5",
    name: "Amendment 5 - Florida Health Innovation",
    effectiveDate: new Date(2025, 4, 1),
    status: "Denied",
  },
  {
    id: "6",
    name: "Amendment 6 - Florida Health Innovation",
    effectiveDate: undefined,
    status: "Denied",
  },
] as const satisfies MockAmendment[];
