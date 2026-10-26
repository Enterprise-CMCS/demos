import { WorkflowApplication } from "components/application";
import { START_OF_2027_EASTERN } from "demos-server-constants";

// Mirrors the server rule: OACT Certification is required when the Application Approval Date
// is on or after 1/1/2027, or has not been entered yet
export const isOactCertificationRequired = (application: WorkflowApplication): boolean => {
  const applicationApprovalDate = application.phases
    .find((phase) => phase.phaseName === "Approval Summary")
    ?.phaseDates.find((date) => date.dateType === "Application Approval Date")?.dateValue;

  return (
    !applicationApprovalDate ||
    new Date(applicationApprovalDate).getTime() >= START_OF_2027_EASTERN.getTime()
  );
};
