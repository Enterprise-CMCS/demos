import React from "react";
import { PhaseSelector } from "./phase-selector/PhaseSelector";
import { DemonstrationStatusBadge } from "../badge/DemonstrationStatusBadge";
import type {
  Demonstration,
  PhaseName,
  ApplicationDate,
  PhaseStatus,
  Document,
  Person,
  ApplicationNote,
} from "demos-server";
import { gql, useQuery } from "@apollo/client";
import { Loading } from "components/loading/Loading";

export const GET_WORKFLOW_DEMONSTRATION_QUERY = gql`
  query GetApplicationWorkflow($id: ID!) {
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

export type SimplePhase = {
  phaseName: PhaseName;
  phaseStatus: PhaseStatus;
  phaseDates: Pick<ApplicationDate, "dateType" | "dateValue">[];
  phaseNotes: Pick<ApplicationNote, "noteType" | "content">[];
};

export type ApplicationWorkflowDocument = Pick<
  Document,
  "id" | "name" | "description" | "documentType" | "phaseName" | "createdAt"
> & {
  owner: { person: Pick<Person, "fullName"> };
};

export type ApplicationWorkflowDemonstration = Pick<
  Demonstration,
  "id" | "status" | "currentPhaseName" | "clearanceLevel" |
  "name" | "state" | "primaryProjectOfficer" | "effectiveDate" |
  "expirationDate" | "sdgDivision" | "signatureLevel" | "description"
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
