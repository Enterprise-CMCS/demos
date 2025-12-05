import React from "react";
import { DeleteIcon } from "components/icons";
import { tw } from "tags/tw";
import { formatDate } from "util/formatDate";
import {
  ApplicationWorkflowDocument,
  GET_WORKFLOW_DEMONSTRATION_QUERY,
} from "components/application/ApplicationWorkflow";
import { gql } from "graphql-tag";
import { Application, Document as ServerDocument } from "demos-server";
import { useMutation } from "@apollo/client";
import { useToast } from "components/toast";
import { DOCUMENT_REMOVAL_FAILED_MESSAGE, DOCUMENT_REMOVED_MESSAGE } from "util/messages";

const STYLES = {
  list: tw`mt-4 space-y-3`,
  fileRow: tw`bg-surface-secondary border border-border-fields px-3 py-2 flex items-center justify-between`,
  fileMeta: tw`text-xs text-text-placeholder mt-0.5`,
};

type Document = {
  application: Pick<Application, "id"> & {
    documents: Pick<ServerDocument, "id">[];
  };
};
export const DELETE_DOCUMENT_MUTATION = gql`
  mutation DeleteDocument($id: ID!) {
    deleteDocument(id: $id) {
      id
    }
  }
`;

export interface DocumentListProps {
  documents: ApplicationWorkflowDocument[];
  showDescription?: boolean;
  emptyMessage?: string;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  showDescription = true,
  emptyMessage = "No documents yet.",
}) => {
  const { showError, showSuccess } = useToast();
  const [deleteDocumentTrigger, { loading }] = useMutation<{
    deleteDocument: Document;
  }>(DELETE_DOCUMENT_MUTATION, {
    refetchQueries: [GET_WORKFLOW_DEMONSTRATION_QUERY],
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteDocumentTrigger({
        variables: { id },
      });
      showSuccess(DOCUMENT_REMOVED_MESSAGE);
    } catch (error) {
      console.error(error);
      showError(DOCUMENT_REMOVAL_FAILED_MESSAGE);
    }
  };

  return (
    <div className={STYLES.list}>
      {documents.length === 0 && (
        <div className="text-sm text-text-placeholder">{emptyMessage}</div>
      )}

      {documents.map((doc) => (
        <div key={doc.id} className={STYLES.fileRow}>
          <div>
            <div className="font-medium">{doc.name}</div>
            <div className={STYLES.fileMeta}>
              {doc.createdAt ? formatDate(doc.createdAt) : "--/--/----"}
              {showDescription && doc.description ? ` • ${doc.description}` : ""}
            </div>
          </div>

          <button
            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
            onClick={() => handleDelete(doc.id)}
            aria-label={`Delete ${doc.name}`}
            title={`Delete ${doc.name}`}
            disabled={loading}
          >
            <DeleteIcon className="w-2 h-2" />
          </button>
        </div>
      ))}
    </div>
  );
};
