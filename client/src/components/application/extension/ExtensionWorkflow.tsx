import React from "react";
import { ApplicationStatusBadge } from "components/badge/ApplicationStatusBadge";
import { PhaseSelector, WorkflowApplication } from "components/application";
import type { Extension, Demonstration, Person } from "demos-server";
import { gql, useQuery } from "@apollo/client";
import { Loading } from "components/loading/Loading";

const EXTENSION_WORKFLOW_QUERY_NAME = "GetExtensionWorkflow";

export const GET_EXTENSION_WORKFLOW_QUERY = gql`
  query ${EXTENSION_WORKFLOW_QUERY_NAME}($id: ID!) {
    extension(id: $id) {
      id
      name
      description
      status
      currentPhaseName
      effectiveDate
      signatureLevel
      clearanceLevel
      demonstration {
        id
        name
        primaryProjectOfficer {
          id
          fullName
        }
      }
      phases {
        phaseName
        phaseStatus
        phaseDates {
          dateType
          dateValue
        }
        phaseNotes {
          noteType
          content
        }
      }
      tags
      documents {
        id
        name
        description
        documentType
        phaseName
        createdAt
        owner {
          person {
            fullName
          }
        }
      }
    }
  }
`;

export type ApplicationWorkflowExtension = WorkflowApplication &
  Pick<Extension, "status" | "name" | "effectiveDate" | "signatureLevel" | "description"> & {
    demonstration: Pick<Demonstration, "id" | "name"> & {
      primaryProjectOfficer: Pick<Person, "id" | "fullName">;
    };
  };

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
        <PhaseSelector application={data.extension} />
      </div>
    );
  }
};
