import { WorkflowApplication } from "components/application";

const OACT_CERTIFICATION_REQUIRED_FROM = "2027-01-01";

// Mirrors the server rule: OACT Certification is required when the Application Approval Date
// is on or after 1/1/2027, or has not been entered yet. Both dates are built from plain date
// strings so timezones don't affect the comparison.
export const isOactCertificationRequired = (application: WorkflowApplication): boolean => {
  const applicationApprovalDate = application.phases
    .find((phase) => phase.phaseName === "Approval Summary")
    ?.phaseDates.find((date) => date.dateType === "Application Approval Date")?.plainDate;

  return (
    !applicationApprovalDate ||
    new Date(applicationApprovalDate).getTime() >=
      new Date(OACT_CERTIFICATION_REQUIRED_FROM).getTime()
  );
};
