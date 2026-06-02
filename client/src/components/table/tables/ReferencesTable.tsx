import React from "react";
import { Table } from "../Table";
import { ReferencesColumns } from "../columns/ReferencesColumns";
import { gql, TypedDocumentNode, useQuery } from "@apollo/client";
import { TagName } from "demos-server";
import { KeywordSearch } from "../KeywordSearch";
import { PaginationControls } from "../PaginationControls";

export type ReferenceAgreement = {
  id: string;
  name: string;
  createdAt: string;
};

export type Reference = {
  id: string;
  name: string;
  description: string;
  agreement: ReferenceAgreement | null;
  demonstrationTypes: TagName[];
  updatedAt: string;
};

export const GET_REFERENCES_QUERY: TypedDocumentNode<
  { references: Reference[] },
  { variables: never }
> = gql`
  query GetReferences {
    references {
      id
      name
      description
      agreement {
        id
        name
        updatedAt
      }
      demonstrationTypes
      updatedAt
    }
  }
`;

export const ReferencesTable: React.FC = () => {
  const referencesColumns = ReferencesColumns();

  const { data, loading, error } = useQuery(GET_REFERENCES_QUERY);

  const references = data?.references;

  return (
    <div className="flex flex-col">
      {loading && <p>Loading references...</p>}
      {error && <p>Error loading references: {error.message}</p>}
      {references && (
        <Table<Reference>
          keywordSearch={(table) => <KeywordSearch table={table} />}
          pagination={(table) => <PaginationControls table={table} />}
          data={references}
          columns={referencesColumns}
        />
      )}
    </div>
  );
};
