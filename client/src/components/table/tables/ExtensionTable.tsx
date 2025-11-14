import * as React from "react";

import { gql, useQuery } from "@apollo/client";
import { ModificationTable } from "./ModificationTable";
import { Extension as ServerExtension } from "demos-server";

export type Extension = Pick<ServerExtension, "id" | "name" | "effectiveDate" | "status" | "createdAt">;
export const EXTENSION_TABLE_QUERY = gql`
  query ExtensionTable($demonstrationId: ID!) {
    demonstration(id: $demonstrationId) {
      id
      extensions {
        id
        name
        effectiveDate
        status
        createdAt
      }
    }
  }
`;

export function ExtensionTable({
  demonstrationId,
  initiallyExpandedId,
}: {
  demonstrationId: string;
  initiallyExpandedId?: string;
}) {
  const { data, loading, error } = useQuery<{ demonstration: { extensions: Extension[] } }>(
    EXTENSION_TABLE_QUERY,
    {
      variables: { demonstrationId },
    }
  );

  if (loading) return <div>Loading...</div>;
  if (error || !data) return <div>Error loading extensions.</div>;

  const extensions = data.demonstration.extensions;

  return (
    <ModificationTable
      modificationType="Extension"
      modifications={extensions}
      initiallyExpandedId={initiallyExpandedId}
    />
  );
}
