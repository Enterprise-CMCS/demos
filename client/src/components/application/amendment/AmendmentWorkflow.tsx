import React from "react";
import { ApplicationStatusBadge } from "components/badge/ApplicationStatusBadge";
import { PhaseSelector } from "../phase-selector/PhaseSelector";
import type { WorkflowApplication } from "../types";
import type { Amendment, DemonstrationTypeAssignment } from "demos-server";
import { gql } from "@apollo/client";
import { WORKFLOW_PHASE_FIELDS, WORKFLOW_DOCUMENT_FIELDS } from "fragments";
import { Demonstration } from "pages/DemonstrationsPage";

const AMENDMENT_WORKFLOW_QUERY_NAME = "GetAmendmentWorkflow";

export const GET_AMENDMENT_WORKFLOW_QUERY = gql`
  query ${AMENDMENT_WORKFLOW_QUERY_NAME}($id: ID!) {
    amendment(id: $id) {
      id
      name
      description
      signatureLevel
      effectiveDate
      currentPhaseName
      clearanceLevel
      status
      demonstration {
        id
        status
        medicaidId
        demonstrationTypes {
          demonstrationTypeName
          status
          effectiveDate
          approvalStatus
          expirationDate
          createdAt
        }
      }
      tags {
        tagName
        approvalStatus
      }
      suggestedApplicationTags
      phases {
        ...WORKFLOW_PHASE_FIELDS
      }
      documents {
        ...WORKFLOW_DOCUMENT_FIELDS
      }
    }
  }
  ${WORKFLOW_PHASE_FIELDS}
  ${WORKFLOW_DOCUMENT_FIELDS}
`;

export type ApplicationWorkflowAmendment = WorkflowApplication &
  Pick<Amendment, "name" | "description" | "effectiveDate" | "signatureLevel" | "status"> & {
    demonstration: Pick<Demonstration, "id" | "status" | "medicaidId"> & {
      demonstrationTypes: Pick<
        DemonstrationTypeAssignment,
        | "demonstrationTypeName"
        | "status"
        | "effectiveDate"
        | "expirationDate"
        | "createdAt"
        | "approvalStatus"
      >[];
    };
  };

export const AmendmentWorkflow = ({ amendment }: { amendment: ApplicationWorkflowAmendment }) => {
  return (
    <div className="flex flex-col gap-sm p-sm">
      <div className="flex w-full">
        <h3 className="text-brand text-2xl font-bold">APPLICATION</h3>
        <ApplicationStatusBadge applicationStatus={amendment.status} />
      </div>
      <hr className="text-border-rules" aria-hidden="true" />
      <PhaseSelector application={amendment} workflowApplicationType="amendment" />
    </div>
  );
};
