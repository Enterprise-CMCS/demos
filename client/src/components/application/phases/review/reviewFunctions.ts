import { SimplePhase } from "../../ApplicationWorkflow";
import { format } from "date-fns";

export interface ReviewPhaseFormData {
  ogcApprovalToShareDate?: string;
  draftApprovalPackageToPrepDate?: string;
  ddmeApprovalReceivedDate?: string;
  stateConcurrenceDate?: string;
  bnPmtApprovalReceivedDate?: string;
  draftApprovalPackageSharedDate?: string;
  receiveOMBConcurrenceDate?: string;
  receiveOGCLegalClearanceDate?: string;
  poOGDNotes?: string;
  ogcOMBNotes?: string;
}

export function getFormDataFromPhase(reviewPhase: SimplePhase): ReviewPhaseFormData {
  const getDateValue = (dateType: string) => {
    const dateValue = reviewPhase.phaseDates.find((d) => d.dateType === dateType)?.dateValue;
    if (!dateValue) return undefined;
    return format(new Date(dateValue), "yyyy-MM-dd");
  };

  return {
    ogcApprovalToShareDate: getDateValue("OGC Approval to Share with SMEs"),
    draftApprovalPackageToPrepDate: getDateValue("Draft Approval Package to Prep"),
    ddmeApprovalReceivedDate: getDateValue("DDME Approval Received"),
    stateConcurrenceDate: getDateValue("State Concurrence"),
    bnPmtApprovalReceivedDate: getDateValue("BN PMT Approval to Send to OMB"),
    draftApprovalPackageSharedDate: getDateValue("Draft Approval Package Shared"),
    receiveOMBConcurrenceDate: getDateValue("Receive OMB Concurrence"),
    receiveOGCLegalClearanceDate: getDateValue("Receive OGC Legal Clearance"),
    poOGDNotes: "",
    ogcOMBNotes: "",
  };
}

export function isFormComplete(reviewPhaseFormData: ReviewPhaseFormData): boolean {
  return !!(
    reviewPhaseFormData.ogcApprovalToShareDate &&
    reviewPhaseFormData.draftApprovalPackageToPrepDate &&
    reviewPhaseFormData.ddmeApprovalReceivedDate &&
    reviewPhaseFormData.stateConcurrenceDate &&
    reviewPhaseFormData.bnPmtApprovalReceivedDate &&
    reviewPhaseFormData.draftApprovalPackageSharedDate &&
    reviewPhaseFormData.receiveOMBConcurrenceDate &&
    reviewPhaseFormData.receiveOGCLegalClearanceDate
  );
}

export function hasFormChanges(
  originalFormData: ReviewPhaseFormData,
  activeFormData: ReviewPhaseFormData
): boolean {
  return !!(
    activeFormData.ogcApprovalToShareDate !== originalFormData.ogcApprovalToShareDate ||
    activeFormData.draftApprovalPackageToPrepDate !==
      originalFormData.draftApprovalPackageToPrepDate ||
    activeFormData.ddmeApprovalReceivedDate !== originalFormData.ddmeApprovalReceivedDate ||
    activeFormData.stateConcurrenceDate !== originalFormData.stateConcurrenceDate ||
    activeFormData.bnPmtApprovalReceivedDate !== originalFormData.bnPmtApprovalReceivedDate ||
    activeFormData.draftApprovalPackageSharedDate !==
      originalFormData.draftApprovalPackageSharedDate ||
    activeFormData.receiveOMBConcurrenceDate !== originalFormData.receiveOMBConcurrenceDate ||
    activeFormData.receiveOGCLegalClearanceDate !== originalFormData.receiveOGCLegalClearanceDate ||
    activeFormData.poOGDNotes !== originalFormData.poOGDNotes ||
    activeFormData.ogcOMBNotes !== originalFormData.ogcOMBNotes
  );
}
