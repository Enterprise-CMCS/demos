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
  State,
  DemonstrationTypeAssignment,
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
  | "id"
  | "status"
  | "currentPhaseName"
  | "clearanceLevel"
  | "name"
  | "effectiveDate"
  | "expirationDate"
  | "sdgDivision"
  | "signatureLevel"
  | "description"
  | "tags"
> & {
  state: Pick<State, "id" | "name">;
  primaryProjectOfficer: Pick<Person, "id" | "fullName">;
  phases: SimplePhase[];
  documents: ApplicationWorkflowDocument[];
  demonstrationTypes: Pick<
    DemonstrationTypeAssignment,
    "demonstrationTypeName" | "status" | "effectiveDate" | "expirationDate" | "createdAt"
  >[];
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
