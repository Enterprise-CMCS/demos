import { gql, useMutation, DocumentNode } from "@apollo/client";
import { DEMONSTRATION_DETAIL_QUERY } from "pages/DemonstrationDetail/DemonstrationDetail";
import { GET_WORKFLOW_DEMONSTRATION_QUERY } from "components/application/demonstration/DemonstrationWorkflow";
import React from "react";
import { RemoveDocumentDialogView } from "./RemoveDocumentDialogView";

export const DELETE_DOCUMENTS_QUERY = gql`
  mutation DeleteDocuments($ids: [ID!]!) {
    deleteDocuments(ids: $ids)
  }
`;

export const DELETE_DELIVERABLE_CMS_DOCUMENTS_QUERY = gql`
  mutation DeleteDeliverableCmsDocuments($ids: [ID!]!) {
    deleteDeliverableCmsDocuments(ids: $ids)
  }
`;

export const DELETE_DELIVERABLE_STATE_DOCUMENTS_QUERY = gql`
  mutation DeleteDeliverableStateDocuments($ids: [ID!]!) {
    deleteDeliverableStateDocuments(ids: $ids)
  }
`;

export const RemoveApplicationDocumentsDialog: React.FC<{
  documentIds: string[];
  onClose: () => void;
  refetchQueries?: DocumentNode[];
}> = ({
  documentIds,
  onClose,
  refetchQueries = [DEMONSTRATION_DETAIL_QUERY, GET_WORKFLOW_DEMONSTRATION_QUERY],
}) => {
  const [deleteDocumentsTrigger] = useMutation<{
    deleteDocuments: number;
  }>(DELETE_DOCUMENTS_QUERY);

  return (
    <RemoveDocumentDialogView
      documentIds={documentIds}
      onClose={onClose}
      onConfirm={(ids) => deleteDocumentsTrigger({ variables: { ids }, refetchQueries })}
    />
  );
};

export const RemoveDeliverableCmsDocumentsDialog: React.FC<{
  documentIds: string[];
  onClose: () => void;
  refetchQueries?: DocumentNode[];
}> = ({
  documentIds,
  onClose,
  refetchQueries = [DEMONSTRATION_DETAIL_QUERY, GET_WORKFLOW_DEMONSTRATION_QUERY],
}) => {
  const [deleteDeliverableCmsDocumentsTrigger] = useMutation<{
    deleteDeliverableCmsDocuments: number;
  }>(DELETE_DELIVERABLE_CMS_DOCUMENTS_QUERY);

  return (
    <RemoveDocumentDialogView
      documentIds={documentIds}
      onClose={onClose}
      onConfirm={(ids) =>
        deleteDeliverableCmsDocumentsTrigger({ variables: { ids }, refetchQueries })
      }
    />
  );
};

export const RemoveDeliverableStateDocumentsDialog: React.FC<{
  documentIds: string[];
  onClose: () => void;
  refetchQueries?: DocumentNode[];
}> = ({
  documentIds,
  onClose,
  refetchQueries = [DEMONSTRATION_DETAIL_QUERY, GET_WORKFLOW_DEMONSTRATION_QUERY],
}) => {
  const [deleteDeliverableStateDocumentsTrigger] = useMutation<{
    deleteDeliverableStateDocuments: number;
  }>(DELETE_DELIVERABLE_STATE_DOCUMENTS_QUERY);

  return (
    <RemoveDocumentDialogView
      documentIds={documentIds}
      onClose={onClose}
      onConfirm={(ids) =>
        deleteDeliverableStateDocumentsTrigger({ variables: { ids }, refetchQueries })
      }
    />
  );
};
