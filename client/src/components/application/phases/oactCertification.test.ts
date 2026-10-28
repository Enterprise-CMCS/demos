import { describe, it, expect } from "vitest";
import { isOactCertificationRequired } from "./oactCertification";
import { SimplePhase, WorkflowApplication } from "components/application";

const createApplication = (phases: SimplePhase[]): WorkflowApplication => ({
  id: "demo-1",
  clearanceLevel: "COMMs",
  status: "Under Review",
  currentPhaseName: "Review",
  phases,
  documents: [],
  tags: [],
});

const createApprovalSummaryPhase = (approvalDate?: {
  dateValue: Date;
  plainDate: string;
}): SimplePhase => ({
  phaseName: "Approval Summary",
  phaseStatus: "Not Started",
  phaseDates: approvalDate ? [{ dateType: "Application Approval Date", ...approvalDate }] : [],
  phaseNotes: [],
});

describe("isOactCertificationRequired", () => {
  it("is required when there is no Approval Summary phase", () => {
    expect(isOactCertificationRequired(createApplication([]))).toBe(true);
  });

  it("is required when the Application Approval Date is missing", () => {
    expect(isOactCertificationRequired(createApplication([createApprovalSummaryPhase()]))).toBe(
      true
    );
  });

  it("is not required when the Application Approval Date is 12/31/2026", () => {
    const application = createApplication([
      createApprovalSummaryPhase({
        dateValue: new Date("2026-12-31T05:00:00.000Z"),
        plainDate: "2026-12-31",
      }),
    ]);

    expect(isOactCertificationRequired(application)).toBe(false);
  });

  it("is required when the Application Approval Date is 1/1/2027", () => {
    const application = createApplication([
      createApprovalSummaryPhase({
        dateValue: new Date("2027-01-01T05:00:00.000Z"),
        plainDate: "2027-01-01",
      }),
    ]);

    expect(isOactCertificationRequired(application)).toBe(true);
  });
});
