import { ApplicationStatus, Extension } from "demos-server";

export type MockExtension = Pick<Extension, "id" | "name" | "effectiveDate"> & {
  status: ApplicationStatus;
};

export const mockExtensions = [
  {
    id: "1",
    name: "Extension 1 - Montana Medicaid Waiver",
    effectiveDate: new Date(2025, 0, 1),
    status: "Under Review",
  },
  {
    id: "2",
    name: "Extension 2 - Montana Medicaid Waiver",
    effectiveDate: new Date(2025, 1, 1),
    status: "Approved",
  },
  {
    id: "3",
    name: "Extension 3 - Montana Medicaid Waiver",
    effectiveDate: null,
    status: "Approved",
  },
] as const satisfies MockExtension[];
