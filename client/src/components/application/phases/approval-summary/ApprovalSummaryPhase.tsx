import React, { useState } from "react";
import { useMutation, gql } from "@apollo/client";
import { formatDate, formatDateForServer, getTodayEst } from "util/formatDate";
import { ApplicationStatus, DateType, UpdateDemonstrationInput } from "demos-server";
import { ApplicationWorkflowDemonstration } from "components/application/ApplicationWorkflow";
import { ApplicationDetailsSection, ApplicationDetailsFormData } from "./applicationDetailsSection";
import { DemonstrationTypesSection } from "./demonstrationTypesSection";
import { DemonstrationDetailDemonstrationType } from "pages/DemonstrationDetail/DemonstrationTab";
import { useSetApplicationDate } from "components/application/date/dateQueries";

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

const RESET_DEMONSTRATION_INPUT: UpdateDemonstrationInput = {
  effectiveDate: null,
  expirationDate: null,
  description: "",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sdgDivision: null as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signatureLevel: null as any,
};

type ApprovalSummaryPhaseProps = {
  demonstrationId: string;
  initialFormData: ApplicationDetailsFormData;
  initialTypes: DemonstrationDetailDemonstrationType[];
  approvalSummaryPhase?: {
    phaseStatus: string;
    phaseDates: Array<{ dateType: string; dateValue: string | Date }>;
  };
  demonstrationTypeCompletionDate?: Date;
};

export const getApprovalSummaryFormData = (
  demonstration: ApplicationWorkflowDemonstration
): ApplicationDetailsFormData => {
  const formData = {
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

export const getApprovalSummaryPhase = (demonstration: ApplicationWorkflowDemonstration) => {
  const approvalSummaryFormData = getApprovalSummaryFormData(demonstration);

  // Find the Approval Summary phase data if it exists
  const approvalSummaryPhase = demonstration.phases?.find(
    (phase) => phase.phaseName === "Approval Summary"
  );
  const demonstrationTypeCompletionDate = approvalSummaryPhase?.phaseDates.find(
    (d) => d.dateType === "Application Demonstration Types Marked Complete Date"
  )?.dateValue;

  return (
    <ApprovalSummaryPhase
      demonstrationId={demonstration.id}
      initialFormData={approvalSummaryFormData}
      initialTypes={demonstration.demonstrationTypes}
      approvalSummaryPhase={approvalSummaryPhase}
      demonstrationTypeCompletionDate={demonstrationTypeCompletionDate}
    />
  );
};

export const ApprovalSummaryPhase = ({
  initialFormData,
  initialTypes,
  demonstrationId,
  approvalSummaryPhase,
  demonstrationTypeCompletionDate,
}: ApprovalSummaryPhaseProps) => {
  const [approvalSummaryFormData, setApprovalSummaryFormData] =
    useState<ApplicationDetailsFormData>(initialFormData);

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
  const [applicationDetailsCompletionDate, setApplicationDetailsCompletionDate] =
    useState<string | undefined>(
      applicationDetailsCompleteDate
        ? formatDate(applicationDetailsCompleteDate)
        : undefined
    );

  const markDemonstrationTypesComplete = async (complete: boolean) => {
    setIsDemonstrationTypesComplete(complete);
    if (complete) {
      await setApplicationDate({
        applicationId: demonstrationId,
        dateType: "Application Demonstration Types Marked Complete Date" satisfies DateType,
        dateValue: getTodayEst(),
      });
    }
    else {
      await setApplicationDate({
        applicationId: demonstrationId,
        dateType: "Application Demonstration Types Marked Complete Date" satisfies DateType,
        dateValue: null,
      });
    }
  };

  const [updateDemonstrationTrigger] = useMutation(UPDATE_DEMONSTRATION_MUTATION);

  // Set up date mutation for Application Details completion persistence
  const { setApplicationDate } = useSetApplicationDate();

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

    await updateDemonstrationTrigger({
      variables: {
        id: demonstrationId,
        input: updateInput,
      },
    });
  };

  const canMarkComplete =
    !!approvalSummaryFormData.effectiveDate &&
    !!approvalSummaryFormData.expirationDate &&
    !!approvalSummaryFormData.sdgDivision &&
    !!approvalSummaryFormData.signatureLevel;

  const setApplicationDetailsUIState = (complete: boolean) => {
    setIsApplicationDetailsComplete(complete);
    setApplicationDetailsCompletionDate(
      complete ? formatDate(getTodayEst()) : undefined
    );
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
        applicationId: demonstrationId,
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
      await updateDemonstrationTrigger({
        variables: {
          id: demonstrationId,
          input: RESET_DEMONSTRATION_INPUT,
        },
      });

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
        applicationId: demonstrationId,
        dateType: "Application Details Marked Complete Date",
        dateValue: null,
      });

      setApplicationDetailsUIState(false);
    } catch (error) {
      console.error("Failed to reset application details:", error);
    }
  };

  const demonstrationForTypes = {
    id: demonstrationId,
    status: approvalSummaryFormData.status as ApplicationStatus,
    demonstrationTypes: initialTypes,
  };

  return (
    <div>
      <h3 className="text-brand text-[22px] font-bold tracking-wide mb-1">Approval Summary</h3>
      <p className="text-sm text-text-placeholder mb-1">Approval Summary Description</p>

      <section className="bg-white pt-2 flex flex-col gap-2">
        <ApplicationDetailsSection
          sectionFormData={approvalSummaryFormData}
          setSectionFormData={setApprovalSummaryFormData}
          isComplete={isApplicationDetailsComplete}
          isReadonly={false}
          onMarkComplete={handleMarkComplete}
          onMarkIncomplete={handleMarkIncomplete}
          completionDate={applicationDetailsCompletionDate}
        />

        <DemonstrationTypesSection
          demonstration={demonstrationForTypes}
          isComplete={isDemonstrationTypesComplete}
          completionDate={demonstrationTypeCompletionDate ? formatDate(demonstrationTypeCompletionDate) : undefined}
          onMarkComplete={markDemonstrationTypesComplete}
        />
      </section>
    </div>
  );
};
