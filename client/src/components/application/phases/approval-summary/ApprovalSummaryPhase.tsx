import React, { useState } from "react";

import { format } from "date-fns";
import { ApplicationWorkflowDemonstration } from "components/application/ApplicationWorkflow";
import { ApplicationDetailsSection, ApplicationDetailsFormData } from "./applicationDetailsSection";
import { DemonstrationTypesSection } from "./demonstrationTypesSection";
import { DemonstrationDetailDemonstrationType } from "pages/DemonstrationDetail/DemonstrationTab";
import { Demonstration as ServerDemonstration } from "demos-server";

type Demonstration = Pick<ServerDemonstration, "id" | "status"> & {
  demonstrationTypes: DemonstrationDetailDemonstrationType[];
};

type ApprovalSummaryPhaseProps = {
  demonstration: Demonstration;
  initialFormData: ApplicationDetailsFormData;
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
  const approvalSummaryFormData = getApprovalSummaryFormData(demonstration);

  return (
    <ApprovalSummaryPhase demonstration={demonstration} initialFormData={approvalSummaryFormData} />
  );
};

export const ApprovalSummaryPhase = ({
  initialFormData,
  demonstration,
}: ApprovalSummaryPhaseProps) => {
  const [approvalSummaryFormData, setApprovalSummaryFormData] =
    useState<ApplicationDetailsFormData>(initialFormData);

  const [isApplicationDetailsComplete, setIsApplicationDetailsComplete] = useState(false);
  const [isDemonstrationTypesComplete, setIsDemonstrationTypesComplete] = useState(false);

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
          demonstration={demonstration}
          isComplete={isDemonstrationTypesComplete}
          onMarkComplete={(complete: boolean) => setIsDemonstrationTypesComplete(complete)}
        />
      </section>
    </div>
  );
};
