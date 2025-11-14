import React from "react";
import { PhaseSelector } from "./phase-selector/PhaseSelector";
import { DemonstrationStatusBadge } from "../badge/DemonstrationStatusBadge";
import type {
  Demonstration,
  PhaseName,
  ApplicationDate,
  PhaseStatus,
  Document,
} from "demos-server";
import { gql, useQuery } from "@apollo/client";
import { Loading } from "components/loading/Loading";

export const GET_WORKFLOW_DEMONSTRATION_QUERY = gql`
  query GetApplicationWorkflow($id: ID!) {
    demonstration(id: $id) {
      id
      status
      currentPhaseName
      phases {
        phaseName
        phaseStatus
        phaseDates {
          dateType
          dateValue
        }
      }
      documents {
        id
        name
        description
        documentType
        createdAt
      }
    }
  }
`;

export type SimplePhase = {
  phaseName: PhaseName;
  phaseStatus: PhaseStatus;
  phaseDates: Pick<ApplicationDate, "dateType" | "dateValue">[];
};

export type ApplicationWorkflowDocument = Pick<
  Document,
  "id" | "name" | "description" | "documentType" | "createdAt"
>;

export type ApplicationWorkflowDemonstration = Pick<
  Demonstration,
  "id" | "status" | "currentPhaseName"
> & {
  phases: SimplePhase[];
  documents: ApplicationWorkflowDocument[];
};

export const ApplicationWorkflow = ({ demonstrationId }: { demonstrationId: string }) => {
  const { data, loading, error } = useQuery<{ demonstration: ApplicationWorkflowDemonstration }>(
    GET_WORKFLOW_DEMONSTRATION_QUERY,
    {
      variables: { id: demonstrationId },
    }
  );

  if (loading) return <Loading />;
  if (error) return <p>Error Loading Application Workflow: {error.message}</p>;
  if (data) {
    return (
      <div className="flex flex-col gap-sm p-sm">
        <div className="flex w-full">
          <h3 className="text-brand text-2xl font-bold">APPLICATION</h3>
          <DemonstrationStatusBadge demonstrationStatus={data.demonstration.status} />
        </div>
        <hr className="text-border-rules" />
        <PhaseSelector demonstration={data.demonstration} />
      </div>
    );
  }
};
