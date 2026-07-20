import React from "react";
import { Table } from "../Table";
import { ReferencesColumns } from "../columns/ReferencesColumns";
import { gql, TypedDocumentNode, useQuery } from "@apollo/client";
import { Reference, ReferenceAgreement, Tag } from "demos-server";
import { KeywordSearch } from "../KeywordSearch";
import { PaginationControls } from "../PaginationControls";
import { compareDesc } from "date-fns";
import { useDownloadReference } from "hooks/useDownloadReference";

export const DESCRIPTION_TEXT =
  "Documents supporting monitoring and evaluation for Medicaid Section 1115 demonstrations are listed below.";

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
  const [downloadingReferences, setDownloadingReferences] = React.useState<Set<string>>(new Set());
  const { downloadReference } = useDownloadReference();

  const handleDownload = async (id: string) => {
    setDownloadingReferences((current) => new Set(current).add(id));

    try {
      await downloadReference({ id, acceptedAgreementId: null });
    } catch {
      // useDownloadReference reports download errors to the user.
    } finally {
      setDownloadingReferences((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  };

  const referencesColumns = ReferencesColumns(handleDownload, downloadingReferences);

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
          data={[...references].sort((a, b) => compareDesc(a.updatedAt, b.updatedAt))}
          columns={referencesColumns}
          descriptionText={DESCRIPTION_TEXT}
        />
      )}
    </div>
  );
};
