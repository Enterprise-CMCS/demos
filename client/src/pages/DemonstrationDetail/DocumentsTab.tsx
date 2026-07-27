import React from "react";
import { DocumentNode, gql, useQuery } from "@apollo/client";
import { IconButton } from "components/button";
import { useDialog } from "components/dialog/DialogContext";
import { AddNewIcon } from "components/icons";
import { TabHeader } from "components/table/TabHeader";
import { DocumentTable, DocumentTableDocument } from "components/table/tables/DocumentTable";
import { NON_DELIVERABLE_DOCUMENT_TYPES } from "demos-server-constants";

export const DEMONSTRATION_DOCUMENTS_QUERY = gql`
  query GetDemonstrationDocuments($id: ID!) {
    demonstration(id: $id) {
      id
      documents {
        id
        name
        description
        documentType
        createdAt
        owner {
          person {
            fullName
          }
        }
      }
    }
  }
`;

export const DocumentsTab = ({
  demonstrationId,
  refetchQueries,
  onDocumentUploadSucceeded,
}: {
  demonstrationId: string;
  refetchQueries: DocumentNode[];
  onDocumentUploadSucceeded: () => Promise<void>;
}) => {
  const { showUploadDocumentDialog } = useDialog();
  const { data, loading, error } = useQuery<{
    demonstration: { documents: DocumentTableDocument[] };
  }>(DEMONSTRATION_DOCUMENTS_QUERY, { variables: { id: demonstrationId } });

  if (loading) return <div className="p-4">Loading documents...</div>;
  if (error || !data) return <div className="p-4 text-red-500">Error loading documents.</div>;

  return (
    <>
      <TabHeader title="Documents">
        <IconButton
          icon={<AddNewIcon />}
          name="add-new-document"
          size="small"
          onClick={() =>
            showUploadDocumentDialog(
              demonstrationId,
              onDocumentUploadSucceeded,
              NON_DELIVERABLE_DOCUMENT_TYPES
            )
          }
        >
          Add Document
        </IconButton>
      </TabHeader>
      <DocumentTable documents={data.demonstration.documents} refetchQueries={refetchQueries} />
    </>
  );
};
