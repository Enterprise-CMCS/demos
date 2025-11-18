import * as React from "react";

import { gql, useQuery } from "@apollo/client";
import { ModificationTable } from "./ModificationTable";
import { Amendment as ServerAmendment } from "demos-server";

export type Amendment = Pick<ServerAmendment, "id" | "name" | "effectiveDate" | "status" | "createdAt">;
export const AMENDMENT_TABLE_QUERY = gql`
  query AmendmentTable($demonstrationId: ID!) {
    demonstration(id: $demonstrationId) {
      id
      amendments {
        id
        name
        effectiveDate
        status
        createdAt
      }
    }
  }
`;

export function AmendmentTable({
  demonstrationId,
  initiallyExpandedId,
}: {
  demonstrationId: string;
  initiallyExpandedId?: string;
}) {
  const { data, loading, error } = useQuery<{ demonstration: { amendments: Amendment[] } }>(
    AMENDMENT_TABLE_QUERY,
    {
      variables: { demonstrationId },
    }
  );

  if (loading) return <div>Loading...</div>;
  if (error || !data) return <div>Error loading amendments.</div>;

  const amendments = data.demonstration.amendments;

  return (
    <ModificationTable
      modificationType="Amendment"
      modifications={amendments}
      initiallyExpandedId={initiallyExpandedId}
    />
  );
}
