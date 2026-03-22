import React, { useState } from "react";
import { useMutation, gql } from "@apollo/client";
import { formatDate, formatDateForServer, getTodayEst } from "util/formatDate";
import { ApplicationStatus, DateType, UpdateDemonstrationInput } from "demos-server";
import {
  ApplicationWorkflowAmendment,
  ApplicationWorkflowDemonstration,
  ApplicationWorkflowExtension,
  WorkflowApplication,
  WorkflowApplicationType,
} from "components/application";
import { ApplicationDetailsSection, ApplicationDetailsFormData } from "./applicationDetailsSection";
import { DemonstrationTypesSection } from "./demonstrationTypesSection";
import { DemonstrationDetailDemonstrationType } from "pages/DemonstrationDetail/DemonstrationTab";
import { useSetApplicationDate } from "components/application/date/dateQueries";
import { Button } from "components/button";
import { useCompletePhase } from "components/application/phase-status/phaseCompletionQueries";
import { useToast } from "components/toast";
import { getPhaseCompletedMessage } from "util/messages";
import { useDialog } from "components/dialog/DialogContext";

const UPDATE_DEMONSTRATION_MUTATION = gql`
  mutation UpdateDemonstration($id: ID!, $input: UpdateDemonstrationInput!) {
    updateDemonstration(id: $id, input: $input) {
      id
      name
      description
      effectiveDate
      expirationDate
      sdgDivision
      signatureLevel
      state {
        id
      }
      primaryProjectOfficer {
        id
      }
    }
  }
`;

const UPDATE_AMENDMENT_MUTATION = gql`
  mutation UpdateAmendment($id: ID!, $input: UpdateAmendmentInput!) {
    updateAmendment(id: $id, input: $input) {
      id
      name
      description
      effectiveDate
      signatureLevel
    }
  }
`;

const UPDATE_EXTENSION_MUTATION = gql`
  mutation UpdateExtension($id: ID!, $input: UpdateExtensionInput!) {
    updateExtension(id: $id, input: $input) {
      id
      name
      description
      effectiveDate
      signatureLevel
    }
  }
`;

const RESET_DEMONSTRATION_INPUT: UpdateDemonstrationInput = {
  effectiveDate: null,
  expirationDate: null,
  description: "",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sdgDivision: null as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signatureLevel: null as any,
};

const RESET_MODIFICATION_INPUT = {
  effectiveDate: null,
  description: "",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signatureLevel: null as any,
};

type ApprovalSummaryPhaseProps = {
  applicationId: string;
  initialFormData: ApplicationDetailsFormData;
  initialTypes: DemonstrationDetailDemonstrationType[];
  approvalSummaryPhase?: {
    phaseStatus: string;
    phaseDates: Array<{ dateType: string; dateValue: string | Date }>;
  };
  demonstrationTypeCompletionDate?: Date;
  allPreviousPhasesDone: boolean;
};

export const getDemonstrationApprovalSummaryFormData = (
  demonstration: ApplicationWorkflowDemonstration
): ApplicationDetailsFormData => {
  const formData = {
    applicationType: "demonstration" as const,
    stateId: demonstration.state.id,
    stateName: demonstration.state.name,
    name: demonstration.name,
    projectOfficerId: demonstration.primaryProjectOfficer?.id ?? "",
    projectOfficerName: demonstration.primaryProjectOfficer?.fullName ?? "",
    status: demonstration.status,
    effectiveDate: demonstration.effectiveDate
      ? formatDate(demonstration.effectiveDate)
      : undefined,
    expirationDate: demonstration.expirationDate
      ? formatDate(demonstration.expirationDate)
      : undefined,
    description: demonstration.description,
    sdgDivision: demonstration.sdgDivision,
    signatureLevel: demonstration.signatureLevel,
  };

  return {
    ...formData,
    readonlyFields: {
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
  modification: ApplicationWorkflowAmendment | ApplicationWorkflowExtension,
  modificationType: "amendment" | "extension"
): ApplicationDetailsFormData => {
  const formData = {
    applicationType: modificationType,
    name: modification.name,
    effectiveDate: modification.effectiveDate
      ? formatDate(modification.effectiveDate)
      : undefined,
    description: modification.description,
    signatureLevel: modification.signatureLevel,
    status: modification.status,
  };

  return {
    ...formData,
    readonlyFields: {
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
      application as ApplicationWorkflowAmendment | ApplicationWorkflowExtension,
      workflowApplicationType
    );
  }

  // Find the Approval Summary phase data if it exists
  const approvalSummaryPhase = application.phases?.find(
    (phase) => phase.phaseName === "Approval Summary"
  );
  const demonstrationTypeCompletionDate = approvalSummaryPhase?.phaseDates.find(
    (d) => d.dateType === "Application Demonstration Types Marked Complete Date"
  )?.dateValue;

  const allPreviousPhasesDone = application.phases
    .filter(
      (p) =>
        p.phaseName !== "Concept" &&
        p.phaseName !== "Approval Summary"
    )
    .every((phase) => phase.phaseStatus === "Completed" || phase.phaseStatus === "Skipped");

  return (
    <ApprovalSummaryPhase
      applicationId={application.id}
      initialFormData={approvalSummaryFormData}
      initialTypes={application.demonstrationTypes ?? []} // TODO: Figure out how demonstrationTypes are meant to be handled for amendments/extensions
      approvalSummaryPhase={approvalSummaryPhase}
      demonstrationTypeCompletionDate={demonstrationTypeCompletionDate}
      allPreviousPhasesDone={allPreviousPhasesDone}
    />
  );
};

export const ApprovalSummaryPhase = ({
  initialFormData,
  initialTypes,
  applicationId,
  approvalSummaryPhase,
  demonstrationTypeCompletionDate,
  allPreviousPhasesDone,
}: ApprovalSummaryPhaseProps) => {
  const capitalizedType = initialFormData.applicationType.charAt(0).toUpperCase() + initialFormData.applicationType.slice(1);
  const [approvalSummaryFormData, setApprovalSummaryFormData] =
    useState<ApplicationDetailsFormData>(initialFormData);

  const { showConfirmApproveDialog } = useDialog();
  const { showSuccess, showError } = useToast();

  // Find Application Details completion date from phase dates
  const applicationDetailsCompleteDate = approvalSummaryPhase?.phaseDates?.find(
    (date) => date.dateType === "Application Details Marked Complete Date"
  )?.dateValue;

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
  >(applicationDetailsCompleteDate ? formatDate(applicationDetailsCompleteDate) : undefined);

  // Find Approval Summary phase completion date (if backend has stored it)
  const approvalSummaryCompletionDateValue = approvalSummaryPhase?.phaseDates?.find(
    (date) => date.dateType === "Approval Summary Completion Date"
  )?.dateValue;

  const [approvalSummaryCompletionDate, setApprovalSummaryCompletionDate] = useState<
    string | undefined
  >(
    approvalSummaryCompletionDateValue ? formatDate(approvalSummaryCompletionDateValue) : undefined
  );

  const [updateDemonstrationTrigger] = useMutation(UPDATE_DEMONSTRATION_MUTATION);
  const [updateAmendmentTrigger] = useMutation(UPDATE_AMENDMENT_MUTATION);
  const [updateExtensionTrigger] = useMutation(UPDATE_EXTENSION_MUTATION);

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

  const parseFormDateString = (dateString: string): Date => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return new Date(dateString + "T00:00:00");
    }
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
      const [month, day, year] = dateString.split("/");
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return new Date(dateString);
  };

  const saveApplicationDetailsToBackend = async (formData: ApplicationDetailsFormData) => {
    if (formData.applicationType === "demonstration") {
      const updateInput: UpdateDemonstrationInput = {
        name: formData.name,
        description: formData.description,
        effectiveDate: formData.effectiveDate
          ? formatDateForServer(parseFormDateString(formData.effectiveDate))
          : null,
        expirationDate: formData.expirationDate
          ? formatDateForServer(parseFormDateString(formData.expirationDate))
          : null,
        sdgDivision: formData.sdgDivision,
        signatureLevel: formData.signatureLevel,
        stateId: formData.stateId,
        projectOfficerUserId: formData.projectOfficerId,
      };

      return await updateDemonstrationTrigger({
        variables: {
          id: applicationId,
          input: updateInput,
        },
      });
    }
    const updateInput: UpdateDemonstrationInput = {
      name: formData.name,
      description: formData.description,
      effectiveDate: formData.effectiveDate
        ? formatDateForServer(parseFormDateString(formData.effectiveDate))
        : null,
      signatureLevel: formData.signatureLevel,
    };
    if (formData.applicationType === "amendment") {
      return await updateAmendmentTrigger({
        variables: {
          id: applicationId,
          input: updateInput,
        },
      });
    } else {
      return await updateExtensionTrigger({
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
        approvalSummaryFormData.signatureLevel
      );
    } else {
      return !!(
        approvalSummaryFormData.effectiveDate &&
        approvalSummaryFormData.signatureLevel
      );
    }
  })();

  const setApplicationDetailsUIState = (complete: boolean) => {
    setIsApplicationDetailsComplete(complete);
    setApplicationDetailsCompletionDate(complete ? formatDate(getTodayEst()) : undefined);
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
      if (approvalSummaryFormData.applicationType === "demonstration") {
        await updateDemonstrationTrigger({
          variables: {
            id: applicationId,
            input: RESET_DEMONSTRATION_INPUT,
          },
        });
      } else if (approvalSummaryFormData.applicationType === "amendment") {
        await updateAmendmentTrigger({
          variables: {
            id: applicationId,
            input: RESET_MODIFICATION_INPUT,
          },
        });
      } else {
        await updateExtensionTrigger({
          variables: {
            id: applicationId,
            input: RESET_MODIFICATION_INPUT,
          },
        });
      }

      setApprovalSummaryFormData((previousFormData) => ({
        ...previousFormData,
        effectiveDate: undefined,
        expirationDate: undefined,
        description: "",
        sdgDivision: undefined,
        signatureLevel: undefined,
        readonlyFields: {
          ...previousFormData.readonlyFields,
          effectiveDate: false,
          expirationDate: false,
          description: false,
          sdgDivision: false,
          signatureLevel: false,
        },
      }));

      await setApplicationDate({
        applicationId: applicationId,
        dateType: "Application Details Marked Complete Date",
        dateValue: null,
      });

      setApplicationDetailsUIState(false);
    } catch (error) {
      console.error("Failed to reset application details:", error);
    }
  };

  const demonstrationForTypes = {
    id: applicationId,
    status: approvalSummaryFormData.status as ApplicationStatus,
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
      }));

      setApprovalSummaryCompletionDate(formatDate(today));

      showSuccess(getPhaseCompletedMessage("Approval Summary"));
    } catch (error) {
      console.error("Failed to approve application:", error);
      showError(`Unable to approve ${capitalizedType}.`);
    }
  };

  return (
    <div>
      <h3 className="text-brand text-[22px] font-bold tracking-wide mb-1">APPROVAL SUMMARY</h3>
      <p className="text-sm text-text-placeholder mb-1">Review and verify {capitalizedType} Details and Performance Periods for Demonstration Types before approving this application.</p>

      <section className="bg-white pt-2 flex flex-col gap-2">
        <ApplicationDetailsSection
          sectionFormData={approvalSummaryFormData}
          setSectionFormData={setApprovalSummaryFormData}
          isComplete={isApplicationDetailsComplete}
          isReadonly={isDemonstrationApproved}
          onMarkComplete={handleMarkComplete}
          onMarkIncomplete={handleMarkIncomplete}
          completionDate={applicationDetailsCompletionDate}
        />

        <DemonstrationTypesSection
          demonstration={demonstrationForTypes}
          isComplete={isDemonstrationTypesComplete}
          completionDate={
            demonstrationTypeCompletionDate
              ? formatDate(demonstrationTypeCompletionDate)
              : undefined
          }
          isReadonly={isDemonstrationApproved}
          onMarkComplete={markDemonstrationTypesComplete}
        />
      </section>

      <div className="mt-8 mb-4 flex items-center justify-between">
        <div className="text-sm text-text-placeholder">
          {approvalSummaryCompletionDate && `Completed ${approvalSummaryCompletionDate}`}
        </div>
        <Button
          name="button-approve-application"
          size="small"
          disabled={!canApproveApplication}
          onClick={() => showConfirmApproveDialog(handleApproveApplication)}
        >
          Approve { capitalizedType }
        </Button>
      </div>
    </div>
  );
};
