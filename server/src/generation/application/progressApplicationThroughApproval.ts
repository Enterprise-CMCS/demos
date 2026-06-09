import { ClearanceLevel } from "../../types";
import { DatesInput, DocumentsInput } from "../types";
import { completeApplicationIntakePhase } from "./completePhase/completeApplicationIntakePhase";
import { completeApprovalPackagePhase } from "./completePhase/completeApprovalPackagePhase";
import { completeApprovalSummaryPhase } from "./completePhase/completeApprovalSummaryPhase";
import { completeCompletenessPhase } from "./completePhase/completeCompletenessPhase";
import { completeConceptPhase } from "./completePhase/completeConceptPhase";
import { completeFederalCommentPhase } from "./completePhase/completeFederalCommentPhase";
import { completeReviewPhase } from "./completePhase/completeReviewPhase";
import { completeSdgPreparationPhase } from "./completePhase/completeSdgPreparationPhase";

export type ProgressApplicationThroughApprovalInput = {
  documentOwnerUserId: string;
  dates: DatesInput<
    | "Pre-Submission Submitted Date"
    | "State Application Submitted Date"
    | "Completeness Review Due Date"
    | "State Application Deemed Complete"
    | "Federal Comment Period Start Date"
    | "Federal Comment Period End Date"
    | "Expected Approval Date"
    | "SME Review Date"
    | "FRT Initial Meeting Date"
    | "BNPMT Initial Meeting Date"
    | "OGD Approval to Share with SMEs"
    | "Draft Approval Package to Prep"
    | "DDME Approval Received"
    | "State Concurrence"
    | "BN PMT Approval to Send to OMB"
    | "Draft Approval Package Shared"
    | "Receive OMB Concurrence"
    | "Receive OGC Legal Clearance"
    | "Submit Approval Package to OSORA"
    | "OSORA R1 Comments Due"
    | "OSORA R2 Comments Due"
    | "CMS (OSORA) Clearance End"
    | "Package Sent for COMMs Clearance"
    | "COMMs Clearance Received"
    | "Application Details Marked Complete Date"
    | "Application Demonstration Types Marked Complete Date"
  >;
  documents: DocumentsInput<
    | "Pre-Submission"
    | "State Application"
    | "Application Completeness Letter"
    | "Internal Completeness Review Form"
    | "Approval Letter"
    | "Final Budget Neutrality Formulation Workbook"
    | "Formal OMB Policy Concurrence Email"
    | "Q&A"
    | "Signed Decision Memo"
    | "Special Terms & Conditions"
  >;
  applicationId: string;
  clearanceLevel: ClearanceLevel;
};
export const progressApplicationThroughApproval = async ({
  applicationId,
  documentOwnerUserId,
  dates,
  documents,
  clearanceLevel,
}: ProgressApplicationThroughApprovalInput) => {
  await completeConceptPhase({
    applicationId,
    documentOwnerUserId,
    dates: {
      "Pre-Submission Submitted Date": dates["Pre-Submission Submitted Date"],
    },
    documents: {
      "Pre-Submission": documents["Pre-Submission"],
    },
  });
  await completeApplicationIntakePhase({
    applicationId,
    documentOwnerUserId,
    documents: {
      "State Application": documents["State Application"],
    },
    dates: {
      "State Application Submitted Date": dates["State Application Submitted Date"],
    },
  });
  await completeCompletenessPhase({
    applicationId,
    documentOwnerUserId,
    dates: {
      "State Application Deemed Complete": dates["State Application Deemed Complete"],
      "Federal Comment Period Start Date": dates["Federal Comment Period Start Date"],
      "Federal Comment Period End Date": dates["Federal Comment Period End Date"],
    },
    documents: {
      "Application Completeness Letter": documents["Application Completeness Letter"],
      "Internal Completeness Review Form": documents["Internal Completeness Review Form"],
    },
  });
  await completeFederalCommentPhase({ applicationId });
  await completeSdgPreparationPhase({
    applicationId,
    dates: {
      "Expected Approval Date": dates["Expected Approval Date"],
      "SME Review Date": dates["SME Review Date"],
      "FRT Initial Meeting Date": dates["FRT Initial Meeting Date"],
      "BNPMT Initial Meeting Date": dates["BNPMT Initial Meeting Date"],
    },
  });
  await completeReviewPhase({
    applicationId,
    clearanceLevel,
    dates: {
      "OGD Approval to Share with SMEs": dates["OGD Approval to Share with SMEs"],
      "Draft Approval Package to Prep": dates["Draft Approval Package to Prep"],
      "DDME Approval Received": dates["DDME Approval Received"],
      "State Concurrence": dates["State Concurrence"],
      "BN PMT Approval to Send to OMB": dates["BN PMT Approval to Send to OMB"],
      "Draft Approval Package Shared": dates["Draft Approval Package Shared"],
      "Receive OMB Concurrence": dates["Receive OMB Concurrence"],
      "Receive OGC Legal Clearance": dates["Receive OGC Legal Clearance"],
      "Submit Approval Package to OSORA": dates["Submit Approval Package to OSORA"],
      "OSORA R1 Comments Due": dates["OSORA R1 Comments Due"],
      "OSORA R2 Comments Due": dates["OSORA R2 Comments Due"],
      "CMS (OSORA) Clearance End": dates["CMS (OSORA) Clearance End"],
      "Package Sent for COMMs Clearance": dates["Package Sent for COMMs Clearance"],
      "COMMs Clearance Received": dates["COMMs Clearance Received"],
    },
  });
  await completeApprovalPackagePhase({
    applicationId,
    documentOwnerUserId,
    documents: {
      "Approval Letter": documents["Approval Letter"],
      "Final Budget Neutrality Formulation Workbook":
        documents["Final Budget Neutrality Formulation Workbook"],
      "Formal OMB Policy Concurrence Email": documents["Formal OMB Policy Concurrence Email"],
      "Q&A": documents["Q&A"],
      "Signed Decision Memo": documents["Signed Decision Memo"],
      "Special Terms & Conditions": documents["Special Terms & Conditions"],
    },
  });
  await completeApprovalSummaryPhase({
    applicationId,
    dates: {
      "Application Details Marked Complete Date": dates["Application Details Marked Complete Date"],
      "Application Demonstration Types Marked Complete Date":
        dates["Application Demonstration Types Marked Complete Date"],
    },
  });
};
