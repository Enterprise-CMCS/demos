import React from "react";
import { ApplicationStatusBadge } from "components/badge/ApplicationStatusBadge";
import { PhaseSelector } from "../phase-selector/PhaseSelector";
import type { WorkflowApplication } from "../types";
import type { Demonstration, DemonstrationTypeAssignment, Extension } from "demos-server";
import { gql } from "@apollo/client";
import { WORKFLOW_PHASE_FIELDS, WORKFLOW_DOCUMENT_FIELDS } from "fragments";

const EXTENSION_WORKFLOW_QUERY_NAME = "GetExtensionWorkflow";

export const GET_EXTENSION_WORKFLOW_QUERY = gql`
  query ${EXTENSION_WORKFLOW_QUERY_NAME}($id: ID!) {
    extension(id: $id) {
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

export type ApplicationWorkflowExtension = WorkflowApplication &
  Pick<Extension, "name" | "description" | "effectiveDate" | "signatureLevel" | "status"> & {
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

export const ExtensionWorkflow = ({ extension }: { extension: ApplicationWorkflowExtension }) => {
  return (
    <div className="flex flex-col gap-sm p-sm">
      <div className="flex w-full">
        <h3 className="text-brand text-2xl font-bold">APPLICATION</h3>
        <ApplicationStatusBadge applicationStatus={extension.status} />
      </div>
      <hr className="text-border-rules" aria-hidden="true" />
      <PhaseSelector application={extension} workflowApplicationType="extension" />
    </div>
  );
};
