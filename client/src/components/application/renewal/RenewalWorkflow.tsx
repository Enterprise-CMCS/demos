import React from "react";
import { ApplicationStatusBadge } from "components/badge/ApplicationStatusBadge";
import { PhaseSelector, WorkflowApplication } from "components/application";
import type {
  Demonstration,
  DemonstrationTypeAssignment,
  Extension as Renewal,
} from "demos-server";
import { gql, useQuery } from "@apollo/client";
import { Loading } from "components/loading/Loading";
import { WORKFLOW_PHASE_FIELDS, WORKFLOW_DOCUMENT_FIELDS } from "fragments";

const RENEWAL_WORKFLOW_QUERY_NAME = "GetRenewalWorkflow";

export const GET_RENEWAL_WORKFLOW_QUERY = gql`
  query ${RENEWAL_WORKFLOW_QUERY_NAME}($id: ID!) {
    renewal: extension(id: $id) {
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

export type ApplicationWorkflowRenewal = WorkflowApplication &
  Pick<Renewal, "name" | "description" | "effectiveDate" | "signatureLevel" | "status"> & {
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

export const RenewalWorkflow = ({ renewalId }: { renewalId: string }) => {
  const { data, loading, error } = useQuery<{ renewal: ApplicationWorkflowRenewal }>(
    GET_RENEWAL_WORKFLOW_QUERY,
    {
      variables: { id: renewalId },
    }
  );

  if (loading) return <Loading />;
  if (error) return <p>Error Loading Renewal Workflow: {error.message}</p>;
  if (data) {
    return (
      <div className="flex flex-col gap-sm p-sm">
        <div className="flex w-full">
          <h3 className="text-brand text-2xl font-bold">APPLICATION</h3>
          <ApplicationStatusBadge applicationStatus={data.renewal.status} />
        </div>
        <hr className="text-border-rules" aria-hidden="true" />
        <PhaseSelector application={data.renewal} workflowApplicationType="renewal" />
      </div>
    );
  }
};
