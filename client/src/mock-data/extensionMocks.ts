import { BundleStatus, Extension } from "demos-server";

export type MockExtension = Pick<Extension, "id" | "name" | "effectiveDate"> & {
  status: BundleStatus;
};

export const mockExtensions = [
  {
    id: "1",
    name: "Extension 1 - Test Demonstration 1",
    effectiveDate: new Date(2025, 0, 1),
    status: "Under Review",
  },
  {
    id: "2",
    name: "Extension 2 - Test Demonstration 1",
    effectiveDate: new Date(2025, 1, 1),
    status: "Approved",
  },
  {
    id: "3",
    name: "Extension 3 - Test Demonstration 1",
    effectiveDate: null,
    status: "Approved",
  },
] as const satisfies MockExtension[];
