import React from "react";
import { ApplicationStatusBadge } from "components/badge/ApplicationStatusBadge";
import { PhaseSelector, WorkflowApplication } from "components/application";
import type { Extension } from "demos-server";
import { gql, useQuery } from "@apollo/client";
import { Loading } from "components/loading/Loading";
import { WORKFLOW_PHASE_FIELDS, WORKFLOW_DOCUMENT_FIELDS } from "fragments";

const EXTENSION_WORKFLOW_QUERY_NAME = "GetExtensionWorkflow";

export const GET_EXTENSION_WORKFLOW_QUERY = gql`
  query ${EXTENSION_WORKFLOW_QUERY_NAME}($id: ID!) {
    extension(id: $id) {
      id
      currentPhaseName
      clearanceLevel
      status
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

export type ApplicationWorkflowExtension = WorkflowApplication & Pick<Extension, "status">;

export const ExtensionWorkflow = ({ extensionId }: { extensionId: string }) => {
  const { data, loading, error } = useQuery<{ extension: ApplicationWorkflowExtension }>(
    GET_EXTENSION_WORKFLOW_QUERY,
    {
      variables: { id: extensionId },
    }
  );

  if (loading) return <Loading />;
  if (error) return <p>Error Loading Extension Workflow: {error.message}</p>;
  if (data) {
    return (
      <div className="flex flex-col gap-sm p-sm">
        <div className="flex w-full">
          <h3 className="text-brand text-2xl font-bold">APPLICATION</h3>
          <ApplicationStatusBadge applicationStatus={data.extension.status} />
        </div>
        <hr className="text-border-rules" />
        <PhaseSelector application={data.extension} workflowApplicationType="extension" />
      </div>
    );
  }
};
