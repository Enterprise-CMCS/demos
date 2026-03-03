import React from "react";
import { PhaseSelector } from "components/application/phase-selector/PhaseSelector";
import { ApplicationStatusBadge } from "components/badge/ApplicationStatusBadge";
import type { Demonstration, Person, State, DemonstrationTypeAssignment } from "demos-server";
import { gql, useQuery } from "@apollo/client";
import { Loading } from "components/loading/Loading";
import { WorkflowApplication } from "components/application";

const DEMONSTRATION_WORKFLOW_QUERY_NAME = "GetWorkflowDemonstration";

export const GET_WORKFLOW_DEMONSTRATION_QUERY = gql`
  query ${DEMONSTRATION_WORKFLOW_QUERY_NAME}($id: ID!) {
    demonstration(id: $id) {
      id
      name
      description
      status
      currentPhaseName
      effectiveDate
      expirationDate
      sdgDivision
      signatureLevel
      clearanceLevel
      state {
        id
        name
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
      demonstrationTypes {
        demonstrationTypeName
        status
        effectiveDate
        expirationDate
        createdAt
      }
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
      primaryProjectOfficer {
        id
        fullName
      }
    }
  }
`;

export type ApplicationWorkflowDemonstration = WorkflowApplication &
  Pick<
    Demonstration,
    | "status"
    | "name"
    | "effectiveDate"
    | "expirationDate"
    | "sdgDivision"
    | "signatureLevel"
    | "description"
  > & {
    state: Pick<State, "id" | "name">;
    primaryProjectOfficer: Pick<Person, "id" | "fullName">;
    demonstrationTypes: Pick<
      DemonstrationTypeAssignment,
      "demonstrationTypeName" | "status" | "effectiveDate" | "expirationDate" | "createdAt"
    >[];
  };

export const DemonstrationWorkflow = ({ demonstrationId }: { demonstrationId: string }) => {
  const { data, loading, error } = useQuery<{ demonstration: ApplicationWorkflowDemonstration }>(
    GET_WORKFLOW_DEMONSTRATION_QUERY,
    {
      variables: { id: demonstrationId },
    }
  );

  if (loading) return <Loading />;
  if (error) return <p>Error Loading Demonstration Workflow: {error.message}</p>;
  if (data) {
    return (
      <div className="flex flex-col gap-sm p-sm">
        <div className="flex w-full">
          <h3 className="text-brand text-2xl font-bold">APPLICATION</h3>
          <ApplicationStatusBadge applicationStatus={data.demonstration.status} />
        </div>
        <hr className="text-border-rules" />
        <PhaseSelector application={data.demonstration} />
      </div>
    );
  }
};
