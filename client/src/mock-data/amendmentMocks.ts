import type { BundleStatus } from "demos-server";
import { Amendment } from "demos-server";

export type MockAmendment = Pick<Amendment, "id" | "name" | "effectiveDate"> & {
  status: BundleStatus;
};

export const mockAmendments = [
  {
    id: "1",
    name: "Amendment 1 - Test Demonstration 1",
    effectiveDate: new Date(2025, 0, 1),
    status: "Under Review",
  },
  {
    id: "2",
    name: "Amendment 2 - Test Demonstration 1",
    effectiveDate: new Date(2025, 1, 1),
    status: "Approved",
  },
  {
    id: "3",
    name: "Amendment 3 - Test Demonstration 1",
    effectiveDate: new Date(2025, 2, 1),
    status: "Approved",
  },
  {
    id: "4",
    name: "Amendment 4 - Test Demonstration 2",
    effectiveDate: new Date(2025, 3, 1),
    status: "Under Review",
  },
  {
    id: "5",
    name: "Amendment 5 - Test Demonstration 2",
    effectiveDate: new Date(2025, 4, 1),
    status: "Denied",
  },
  {
    id: "6",
    name: "Amendment 6 - Test Demonstration 2",
    effectiveDate: null,
    status: "Denied",
  },
] as const satisfies MockAmendment[];
