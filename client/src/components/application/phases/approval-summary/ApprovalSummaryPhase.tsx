import React, { useState } from "react";

import { format } from "date-fns";
import { ApplicationWorkflowDemonstration } from "components/application/ApplicationWorkflow";
import { ApplicationDetailsSection, ApplicationDetailsFormData } from "./applicationDetailsSection";
import { DemonstrationTypesSection } from "./demonstrationTypesSection";
import { DemonstrationDetailDemonstrationType } from "pages/DemonstrationDetail/DemonstrationTab";
import { formatDate, formatDateForServer } from "util/formatDate";
import { useSetApplicationDate } from "components/application/date/dateQueries";
import { DateType } from "demos-server";

type ApprovalSummaryPhaseProps = {
  demonstrationId: string;
  initialFormData: ApplicationDetailsFormData;
  initialTypes: DemonstrationDetailDemonstrationType[];
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
      ? format(new Date(demonstration.effectiveDate), "yyyy-MM-dd")
      : undefined,
    expirationDate: demonstration.expirationDate
      ? format(new Date(demonstration.expirationDate), "yyyy-MM-dd")
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
  const approvalSummaryPhase = demonstration.phases.find(
    (phase) => phase.phaseName === "Approval Summary"
  );
  const demonstrationTypeCompletionDate = approvalSummaryPhase?.phaseDates.find(
    (d) => d.dateType === "Application Demonstration Types Marked Complete Date"
  )?.dateValue;
  const approvalSummaryFormData = getApprovalSummaryFormData(demonstration);

  return (
    <ApprovalSummaryPhase
      demonstrationId={demonstration.id}
      initialFormData={approvalSummaryFormData}
      initialTypes={demonstration.demonstrationTypes}
      demonstrationTypeCompletionDate={demonstrationTypeCompletionDate}
    />
  );
};

export const ApprovalSummaryPhase = ({
  initialFormData,
  initialTypes,
  demonstrationId,
  demonstrationTypeCompletionDate,
}: ApprovalSummaryPhaseProps) => {
  const { setApplicationDate } = useSetApplicationDate();
  const [approvalSummaryFormData, setApprovalSummaryFormData] =
    useState<ApplicationDetailsFormData>(initialFormData);

  const [isApplicationDetailsComplete, setIsApplicationDetailsComplete] = useState(false);
  const [isDemonstrationTypesComplete, setIsDemonstrationTypesComplete] = useState(!!demonstrationTypeCompletionDate);

  const markDemonstrationTypesComplete = async (complete: boolean) => {
    setIsDemonstrationTypesComplete(complete);
    if (complete) {
      await setApplicationDate({
        applicationId: demonstrationId,
        dateType: "Application Demonstration Types Marked Complete Date" satisfies DateType,
        dateValue: formatDateForServer(new Date()),
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

  return (
    <div>
      <h3 className="text-brand text-[22px] font-bold tracking-wide mb-1">Approval Summary</h3>
      <p className="text-sm text-text-placeholder mb-1">Approval Summary Description</p>

      <section className="bg-white pt-2 flex flex-col gap-2">
        <ApplicationDetailsSection
          sectionFormData={approvalSummaryFormData}
          setSectionFormData={setApprovalSummaryFormData}
          isComplete={isApplicationDetailsComplete}
          isReadonly={isApplicationDetailsComplete}
          onMarkComplete={() => setIsApplicationDetailsComplete(true)}
        />

        <DemonstrationTypesSection
          demonstrationId={demonstrationId}
          initialTypes={initialTypes}
          isComplete={isDemonstrationTypesComplete}
          completionDate={demonstrationTypeCompletionDate ? formatDate(demonstrationTypeCompletionDate) : undefined}
          onMarkComplete={markDemonstrationTypesComplete}
        />
      </section>
    </div>
  );
};
