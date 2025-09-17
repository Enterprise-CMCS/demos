import React from "react";
import { PhaseSelector } from "./phase-selector/PhaseSelector";
import { DemonstrationStatusBadge } from "./DemonstrationStatusBadge";
import type { DemonstrationStatus } from "demos-server";
import { gql, useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";

export const APPLICATION_WORKFLOW_QUERY = gql`
  query ApplicationWorkflowQuery($demonstrationId: ID!) {
    demonstration(id: $demonstrationId) {
      id
      demonstrationStatus {
        name
      }
    }
  }
`;

export type Demonstration = {
  demonstrationStatus: Pick<DemonstrationStatus, "name">;
};

export const ApplicationWorkflow = () => {
  const { id } = useParams<{ id: string }>();

  const { data, loading, error } = useQuery(APPLICATION_WORKFLOW_QUERY, {
    variables: { demonstrationId: id },
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading application workflow: {error.message}</div>;

  const demonstration = data?.demonstration;

  if (!demonstration) return <div>No demonstration data found.</div>;

  return (
    <div className="flex flex-col gap-sm p-md">
      <div className="flex w-full">
        <h3 className="text-brand text-2xl font-bold">APPLICATION</h3>
        <DemonstrationStatusBadge demonstrationStatus={demonstration.demonstrationStatus.id} />
      </div>
      <hr className="text-border-rules" />
      <PhaseSelector />
    </div>
  );
};
