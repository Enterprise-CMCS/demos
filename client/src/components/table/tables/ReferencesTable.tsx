import React from "react";
import { Table } from "../Table";
import { ReferencesColumns } from "../columns/ReferencesColumns";
import { gql, TypedDocumentNode, useQuery } from "@apollo/client";
import { Reference, ReferenceAgreement, Tag } from "demos-server";
import { KeywordSearch } from "../KeywordSearch";
import { PaginationControls } from "../PaginationControls";

export const GET_REFERENCES_QUERY: TypedDocumentNode<
  {
    references: (Pick<Reference, "id" | "name" | "description" | "updatedAt"> & {
      agreement: Pick<ReferenceAgreement, "id" | "name" | "createdAt"> | null;
      demonstrationTypes: Pick<Tag, "tagName">[];
    })[];
  },
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
        createdAt
      }
      demonstrationTypes {
        tagName
      }
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
        <Table
          keywordSearch={(table) => <KeywordSearch table={table} />}
          pagination={(table) => <PaginationControls table={table} />}
          data={references}
          columns={referencesColumns}
        />
      )}
    </div>
  );
};
