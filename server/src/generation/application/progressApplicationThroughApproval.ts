import { ClearanceLevel, PhaseName } from "../../types";
import { generateSampleDateData } from "../generationData/generateSampleDateData";
import { generateSampleDocumentData } from "../generationData/generateSampleDocumentData";
import { completeApplicationIntakePhase } from "./completePhase/completeApplicationIntakePhase";
import { completeApprovalPackagePhase } from "./completePhase/completeApprovalPackagePhase";
import { completeApprovalSummaryPhase } from "./completePhase/completeApprovalSummaryPhase";
import { completeCompletenessPhase } from "./completePhase/completeCompletenessPhase";
import { completeConceptPhase } from "./completePhase/completeConceptPhase";
import { completeFederalCommentPhase } from "./completePhase/completeFederalCommentPhase";
import { completeReviewPhase } from "./completePhase/completeReviewPhase";
import { completeSdgPreparationPhase } from "./completePhase/completeSdgPreparationPhase";

export const progressApplicationThroughPhase = async ({
  completedThroughPhase,
  applicationId,
  documentOwnerUserId,
}: {
  completedThroughPhase: PhaseName;
  documentOwnerUserId: string;
  applicationId: string;
  clearanceLevel: ClearanceLevel;
}) => {
  const dates = generateSampleDateData({
    approvalDate: new Date(),
  });
  const documents = generateSampleDocumentData();
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
  if (completedThroughPhase === "Concept") return;
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
  if (completedThroughPhase === "Application Intake") return;
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
  if (completedThroughPhase === "Completeness") return;
  await completeFederalCommentPhase({ applicationId });
  if (completedThroughPhase === "Federal Comment") return;
  await completeSdgPreparationPhase({
    applicationId,
    dates: {
      "Expected Approval Date": dates["Expected Approval Date"],
      "SME Review Date": dates["SME Review Date"],
      "FRT Initial Meeting Date": dates["FRT Initial Meeting Date"],
      "BNPMT Initial Meeting Date": dates["BNPMT Initial Meeting Date"],
    },
  });
  if (completedThroughPhase === "SDG Preparation") return;
  await completeReviewPhase({
    applicationId,
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
  if (completedThroughPhase === "Review") return;
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
  if (completedThroughPhase === "Approval Package") return;
  await completeApprovalSummaryPhase({
    applicationId,
    dates: {
      "Application Details Marked Complete Date": dates["Application Details Marked Complete Date"],
      "Application Demonstration Types Marked Complete Date":
        dates["Application Demonstration Types Marked Complete Date"],
    },
  });
};
