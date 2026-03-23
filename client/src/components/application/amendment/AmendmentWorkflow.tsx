import React from "react";
import { ApplicationStatusBadge } from "components/badge/ApplicationStatusBadge";
import { PhaseSelector, WorkflowApplication } from "components/application";
import type { Amendment, DemonstrationTypeAssignment } from "demos-server";
import { gql, useQuery } from "@apollo/client";
import { Loading } from "components/loading/Loading";
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

export type ApplicationWorkflowAmendment =
  WorkflowApplication &
  Pick<
    Amendment,
    "name" |
    "description" |
    "effectiveDate" |
    "signatureLevel" |
    "status"
  > & {
    demonstration: Pick<
        Demonstration,
        | "id"
        | "status"
      > & {
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

export const AmendmentWorkflow = ({ amendmentId }: { amendmentId: string }) => {
  const { data, loading, error } = useQuery<{ amendment: ApplicationWorkflowAmendment }>(
    GET_AMENDMENT_WORKFLOW_QUERY,
    {
      variables: { id: amendmentId },
    }
  );

  if (loading) return <Loading />;
  if (error) return <p>Error Loading Amendment Workflow: {error.message}</p>;
  if (data) {
    return (
      <div className="flex flex-col gap-sm p-sm">
        <div className="flex w-full">
          <h3 className="text-brand text-2xl font-bold">APPLICATION</h3>
          <ApplicationStatusBadge applicationStatus={data.amendment.status} />
        </div>
        <hr className="text-border-rules" />
        <PhaseSelector application={data.amendment} workflowApplicationType="amendment" />
      </div>
    );
  }
};
