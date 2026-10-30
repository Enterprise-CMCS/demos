import React, { useState } from "react";
import { useMutation, gql } from "@apollo/client";
import { assertIsLocalDate, formatDateForDisplay, getTodayEst } from "util/formatDate";
import {
  ApplicationStatus,
  DateType,
  LocalDate,
  UpdateAmendmentInput,
  UpdateDemonstrationInput,
  UpdateExtensionInput,
} from "demos-server";
import {
  ApplicationWorkflowAmendment,
  ApplicationWorkflowDemonstration,
  ApplicationWorkflowRenewal,
  WorkflowApplication,
  WorkflowApplicationType,
} from "components/application";
import { ApplicationDetailsSection, ApplicationDetailsFormData } from "./ApplicationDetailsSection";
import { DemonstrationTypesSection } from "./DemonstrationTypesSection";
import { DemonstrationDetailDemonstrationType } from "pages/DemonstrationDetail/DemonstrationTab";
import { useSetApplicationDate } from "components/application/date/dateQueries";
import { Button } from "components/button";
import { useCompletePhase } from "components/application/phase-status/phaseCompletionQueries";
import { useToast } from "components/toast";
import { getPhaseCompletedMessage, MISSING_REQUIRED_SECTIONS_TOOLTIP } from "util/messages";
import { useDialog } from "components/dialog/DialogContext";
import { getCurrentUser, isReadonly as userIsReadonly } from "components/user/UserContext";

export const UPDATE_DEMONSTRATION_MUTATION = gql`
  mutation UpdateDemonstration($id: ID!, $input: UpdateDemonstrationInput!) {
    updateDemonstration(id: $id, input: $input) {
      id
      name
      description
      effectiveDate
      effectivePlainDate
      expirationDate
      expirationPlainDate
      sdgDivision
      state {
        id
      }
      primaryProjectOfficer {
        id
      }
    }
  }
`;

export const UPDATE_AMENDMENT_MUTATION = gql`
  mutation UpdateAmendment($id: ID!, $input: UpdateAmendmentInput!) {
    updateAmendment(id: $id, input: $input) {
      id
      name
      description
      effectivePlainDate
      signatureLevel
    }
  }
`;

export const UPDATE_RENEWAL_MUTATION = gql`
  mutation UpdateRenewal($id: ID!, $input: UpdateExtensionInput!) {
    updateRenewal: updateExtension(id: $id, input: $input) {
      id
      name
      description
      effectivePlainDate
      signatureLevel
    }
  }
`;

const getStaticFields = (data: ApplicationDetailsFormData) => ({
  name: !!data.name,
  effectiveDate: !!data.effectiveDate,
  description: !!data.description,
  signatureLevel: !!data.signatureLevel,
  ...(data.applicationType === "demonstration" && {
    stateId: !!data.stateId,
    projectOfficerId: !!data.projectOfficerId,
    status: !!data.status,
    expirationDate: !!data.expirationDate,
    sdgDivision: !!data.sdgDivision,
  }),
});

export const getDemonstrationApprovalSummaryFormData = (
  demonstration: ApplicationWorkflowDemonstration
): ApplicationDetailsFormData => {
  const applicationApprovalDate = demonstration.phases
    .find((p) => p.phaseName === "Approval Summary")
    ?.phaseDates.find((d) => d.dateType === "Application Approval Date")?.plainDate;

  const formData = {
    applicationType: "demonstration" as const,
    stateId: demonstration.state.id,
    stateName: demonstration.state.name,
    name: demonstration.name,
    projectOfficerId: demonstration.primaryProjectOfficer?.id ?? "",
    projectOfficerName: demonstration.primaryProjectOfficer?.fullName ?? "",
    status: demonstration.status,
    effectiveDate: demonstration.effectivePlainDate ?? "",
    expirationDate: demonstration.expirationPlainDate ?? "",
    description: demonstration.description,
    sdgDivision: demonstration.sdgDivision,
    signatureLevel: demonstration.signatureLevel,
    applicationApprovalDate: (applicationApprovalDate as LocalDate) ?? undefined,
  };

  return {
    ...formData,
    staticFields: {
      stateId: !!formData.stateId,
      name: !!formData.name,
      projectOfficerId: !!formData.projectOfficerId,
      status: !!formData.status,
      effectiveDate: !!formData.effectiveDate,
      expirationDate: !!formData.expirationDate,
      description: !!formData.description,
      sdgDivision: !!formData.sdgDivision,
      signatureLevel: !!formData.signatureLevel,
    },
  };
};

export const getModificationApprovalSummaryFormData = (
  modification: ApplicationWorkflowAmendment | ApplicationWorkflowRenewal,
  modificationType: "amendment" | "renewal"
): ApplicationDetailsFormData => {
  const applicationApprovalDate = modification.phases
    .find((p) => p.phaseName === "Approval Summary")
    ?.phaseDates.find((d) => d.dateType === "Application Approval Date")?.plainDate;

  const formData = {
    applicationType: modificationType,
    name: modification.name,
    effectiveDate: modification.effectivePlainDate ?? "",
    description: modification.description,
    signatureLevel: modification.signatureLevel,
    status: modification.status,
    applicationApprovalDate: (applicationApprovalDate as LocalDate) ?? undefined,
  };

  return {
    ...formData,
    staticFields: {
      name: !!formData.name,
      effectiveDate: !!formData.effectiveDate,
      description: !!formData.description,
      signatureLevel: !!formData.signatureLevel,
    },
  };
};

export const getApprovalSummaryPhaseFromApplication = (
  application: WorkflowApplication,
  workflowApplicationType: WorkflowApplicationType
) => {
  let approvalSummaryFormData: ApplicationDetailsFormData;

  if (workflowApplicationType === "demonstration") {
    // For Demonstration applications, we have all the necessary fields to populate the Approval Summary form
    approvalSummaryFormData = getDemonstrationApprovalSummaryFormData(
      application as ApplicationWorkflowDemonstration
    );
  } else {
    approvalSummaryFormData = getModificationApprovalSummaryFormData(
      application as ApplicationWorkflowAmendment | ApplicationWorkflowRenewal,
      workflowApplicationType
    );
  }

  // Find the Approval Summary phase data if it exists
  const approvalSummaryPhase = application.phases?.find(
    (phase) => phase.phaseName === "Approval Summary"
  );
  const demonstrationTypeCompletionDate = approvalSummaryPhase?.phaseDates.find(
    (d) => d.dateType === "Application Demonstration Types Marked Complete Date"
  )?.plainDate;

  const allPreviousPhasesDone = application.phases
    .filter((p) => p.phaseName !== "Concept" && p.phaseName !== "Approval Summary")
    .every((phase) => phase.phaseStatus === "Completed" || phase.phaseStatus === "Skipped");

  const demonstration =
    workflowApplicationType === "demonstration"
      ? (application as ApplicationWorkflowDemonstration)
      : (application as ApplicationWorkflowAmendment | ApplicationWorkflowRenewal).demonstration;

  const demonstrationId = demonstration.id;
  const demonstrationTypes = demonstration.demonstrationTypes;
  const demonstrationStatus = demonstration.status;
  const medicaidId = demonstration.medicaidId;

  return (
    <ApprovalSummaryPhase
      applicationId={application.id}
      demonstrationId={demonstrationId}
      initialFormData={approvalSummaryFormData}
      initialTypes={demonstrationTypes}
      approvalSummaryPhase={approvalSummaryPhase}
      demonstrationTypeCompletionDate={demonstrationTypeCompletionDate}
      allPreviousPhasesDone={allPreviousPhasesDone}
      demonstrationStatus={demonstrationStatus}
      medicaidId={medicaidId}
    />
  );
};

export const ApprovalSummaryPhase = ({
  initialFormData,
  initialTypes,
  applicationId,
  demonstrationId,
  medicaidId,
  approvalSummaryPhase,
  demonstrationTypeCompletionDate,
  allPreviousPhasesDone,
  demonstrationStatus,
}: {
  applicationId: string;
  demonstrationId: string;
  medicaidId?: string;
  initialFormData: ApplicationDetailsFormData;
  initialTypes: DemonstrationDetailDemonstrationType[];
  approvalSummaryPhase?: {
    phaseStatus: string;
    phaseDates: Array<{ dateType: string; plainDate: string }>;
  };
  demonstrationTypeCompletionDate?: string;
  allPreviousPhasesDone: boolean;
  demonstrationStatus: ApplicationStatus;
}) => {
  const capitalizedType =
    initialFormData.applicationType.charAt(0).toUpperCase() +
    initialFormData.applicationType.slice(1);
  const [approvalSummaryFormData, setApprovalSummaryFormData] =
    useState<ApplicationDetailsFormData>(initialFormData);

  const { showConfirmApproveDialog } = useDialog();
  const { showSuccess, showError } = useToast();
  const { currentUser } = getCurrentUser();
  const isReadonlyUser = userIsReadonly(currentUser, "ApplicationWorkflow");

  // Find Application Details completion date from phase dates
  const applicationDetailsCompleteDate = approvalSummaryPhase?.phaseDates?.find(
    (date) => date.dateType === "Application Details Marked Complete Date"
  )?.plainDate;

  // Initialize completion status from backend date data
  const [isApplicationDetailsComplete, setIsApplicationDetailsComplete] = useState(
    !!applicationDetailsCompleteDate
  );
  const [isDemonstrationTypesComplete, setIsDemonstrationTypesComplete] = useState(
    !!demonstrationTypeCompletionDate
  );

  // Initialize completion date from backend if available
  const [applicationDetailsCompletionDate, setApplicationDetailsCompletionDate] = useState<
    string | undefined
  >(applicationDetailsCompleteDate);

  // Find Approval Summary phase completion date (if backend has stored it)
  const approvalSummaryCompletionPlainDate = approvalSummaryPhase?.phaseDates?.find(
    (date) => date.dateType === "Approval Summary Completion Date"
  )?.plainDate;

  const [approvalSummaryCompletionDate, setApprovalSummaryCompletionDate] = useState<
    string | undefined
  >(approvalSummaryCompletionPlainDate);

  const [updateDemonstrationTrigger] = useMutation(UPDATE_DEMONSTRATION_MUTATION);
  const [updateAmendmentTrigger] = useMutation(UPDATE_AMENDMENT_MUTATION);
  const [updateRenewalTrigger] = useMutation(UPDATE_RENEWAL_MUTATION);

  const { setApplicationDate } = useSetApplicationDate();

  const { completePhase } = useCompletePhase();

  const markDemonstrationTypesComplete = async (complete: boolean) => {
    setIsDemonstrationTypesComplete(complete);
    if (complete) {
      await setApplicationDate({
        applicationId: applicationId,
        dateType: "Application Demonstration Types Marked Complete Date" satisfies DateType,
        dateValue: getTodayEst(),
      });
    } else {
      await setApplicationDate({
        applicationId: applicationId,
        dateType: "Application Demonstration Types Marked Complete Date" satisfies DateType,
        dateValue: null,
      });
    }
  };

  const saveApplicationDetailsToBackend = async (formData: ApplicationDetailsFormData) => {
    if (formData.applicationType === "demonstration") {
      const updateInput: UpdateDemonstrationInput = {
        name: formData.name,
        description: formData.description,
        effectivePlainDate: assertIsLocalDate(formData.effectiveDate),
        expirationPlainDate: assertIsLocalDate(formData.expirationDate),
        sdgDivision: formData.sdgDivision,
        projectOfficerUserId: formData.projectOfficerId,
      };

      await setApplicationDate({
        applicationId: applicationId,
        dateType: "Application Approval Date",
        dateValue: formData.applicationApprovalDate ?? null,
      });

      return await updateDemonstrationTrigger({
        variables: {
          id: applicationId,
          input: updateInput,
        },
      });
    }
    const updateInput: UpdateAmendmentInput | UpdateExtensionInput = {
      name: formData.name,
      description: formData.description,
      effectivePlainDate: assertIsLocalDate(formData.effectiveDate),
      signatureLevel: formData.signatureLevel,
    };
    if (formData.applicationType === "amendment") {
      await setApplicationDate({
        applicationId: applicationId,
        dateType: "Application Approval Date",
        dateValue: formData.applicationApprovalDate ?? null,
      });
      return await updateAmendmentTrigger({
        variables: {
          id: applicationId,
          input: updateInput,
        },
      });
    } else {
      await setApplicationDate({
        applicationId: applicationId,
        dateType: "Application Approval Date",
        dateValue: formData.applicationApprovalDate ?? null,
      });
      return await updateRenewalTrigger({
        variables: {
          id: applicationId,
          input: updateInput,
        },
      });
    }
  };

  const canMarkComplete = (() => {
    if (approvalSummaryFormData.applicationType === "demonstration") {
      return !!(
        approvalSummaryFormData.effectiveDate &&
        approvalSummaryFormData.expirationDate &&
        approvalSummaryFormData.sdgDivision &&
        approvalSummaryFormData.signatureLevel &&
        approvalSummaryFormData.applicationApprovalDate
      );
    } else {
      return !!(
        approvalSummaryFormData.effectiveDate &&
        approvalSummaryFormData.signatureLevel &&
        approvalSummaryFormData.applicationApprovalDate
      );
    }
  })();

  const setApplicationDetailsUIState = (complete: boolean) => {
    setIsApplicationDetailsComplete(complete);
    setApplicationDetailsCompletionDate(complete ? getTodayEst() : undefined);
  };

  const handleMarkComplete = async () => {
    if (!canMarkComplete) {
      console.warn("Cannot mark complete: Missing required fields");
      return;
    }

    try {
      setApplicationDetailsUIState(true);

      await saveApplicationDetailsToBackend(approvalSummaryFormData);

      await setApplicationDate({
        applicationId: applicationId,
        dateType: "Application Details Marked Complete Date",
        dateValue: getTodayEst(),
      });
    } catch (error) {
      console.error("Failed to save application details:", error);
      setApplicationDetailsUIState(false);
    }
  };

  const handleMarkIncomplete = async () => {
    try {
      await setApplicationDate({
        applicationId: applicationId,
        dateType: "Application Details Marked Complete Date",
        dateValue: null,
      });

      setApprovalSummaryFormData((previousFormData) => ({
        ...previousFormData,
        staticFields: getStaticFields(previousFormData), // Recalculate readonly fields based on current form data when marking incomplete
      }));

      setApplicationDetailsUIState(false);
    } catch (error) {
      console.error("Failed to set Completion Date:", error);
    }
  };

  const demonstrationForTypes = {
    id: demonstrationId, // Use demonstrationId, which is the same for demonstrations, but for amendments/renewals it comes from the nested demonstration object
    status: demonstrationStatus, // Similarly, get status from the correct place based on application type
    demonstrationTypes: initialTypes,
  };

  const isDemonstrationApproved =
    (approvalSummaryFormData.status as ApplicationStatus) === "Approved";

  const canApproveApplication =
    !isDemonstrationApproved &&
    isApplicationDetailsComplete &&
    isDemonstrationTypesComplete &&
    allPreviousPhasesDone;

  const handleApproveApplication = async () => {
    if (!canApproveApplication) {
      return;
    }

    const today = getTodayEst();

    try {
      // Complete the Approval Summary phase, which also approves the demonstration
      await completePhase({
        applicationId: applicationId,
        phaseName: "Approval Summary",
      });

      setApprovalSummaryFormData((previousFormData) => ({
        ...previousFormData,
        status: "Approved",
        staticFields: Object.fromEntries(
          Object.keys(previousFormData.staticFields).map((key) => [key, true])
        ) as typeof previousFormData.staticFields,
      }));

      setApprovalSummaryCompletionDate(today);

      showSuccess(getPhaseCompletedMessage("Approval Summary"));
    } catch (error) {
      console.error("Failed to approve application:", error);
      showError(`Unable to approve ${capitalizedType}.`);
    }
  };

  return (
    <div>
      <h3 className="text-brand text-[22px] font-bold tracking-wide mb-1">APPROVAL SUMMARY</h3>
      <p className="text-sm text-text-placeholder mb-1">
        Review and verify {capitalizedType} Details and Performance Periods for Demonstration Types
        before approving this application.
      </p>

      <section className="bg-white pt-2 flex flex-col gap-2">
        <ApplicationDetailsSection
          sectionFormData={approvalSummaryFormData}
          setSectionFormData={setApprovalSummaryFormData}
          isComplete={isApplicationDetailsComplete}
          isDemonstrationApproved={isDemonstrationApproved}
          onMarkComplete={handleMarkComplete}
          onMarkIncomplete={handleMarkIncomplete}
          completionDate={
            applicationDetailsCompletionDate
              ? formatDateForDisplay(applicationDetailsCompletionDate)
              : undefined
          }
          medicaidId={medicaidId}
        />

        <DemonstrationTypesSection
          demonstration={demonstrationForTypes}
          isComplete={isDemonstrationTypesComplete}
          completionDate={
            demonstrationTypeCompletionDate
              ? formatDateForDisplay(demonstrationTypeCompletionDate)
              : undefined
          }
          isDemonstrationApproved={isDemonstrationApproved}
          onMarkComplete={markDemonstrationTypesComplete}
        />
      </section>

      <div className="mt-8 mb-4 flex items-center justify-between">
        <div className="text-sm text-text-placeholder">
          {approvalSummaryCompletionDate &&
            `Completed ${formatDateForDisplay(approvalSummaryCompletionDate)}`}
        </div>
        <Button
          name="button-approve-application"
          size="small"
          isHidden={isReadonlyUser}
          disabled={!canApproveApplication}
          onClick={() =>
            showConfirmApproveDialog(handleApproveApplication, initialFormData.applicationType)
          }
          eagerTooltip={
            !canApproveApplication && !isDemonstrationApproved
              ? MISSING_REQUIRED_SECTIONS_TOOLTIP
              : undefined
          }
        >
          Approve {capitalizedType}
        </Button>
      </div>
    </div>
  );
};
