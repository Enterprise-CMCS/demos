import { gql, useMutation, DocumentNode, TypedDocumentNode } from "@apollo/client";
import React from "react";
import { UpdateDocumentInput } from "demos-server";
import { DEMONSTRATION_DETAIL_QUERY } from "pages/DemonstrationDetail/DemonstrationDetail";
import { Document, EditDocumentDialogView } from "./EditDocumentDialogView";

export const UPDATE_DOCUMENT_QUERY: TypedDocumentNode<
  { updateDocument: Document },
  { id: string; input: UpdateDocumentInput }
> = gql`
  mutation UpdateDocument($id: ID!, $input: UpdateDocumentInput!) {
    updateDocument(id: $id, input: $input) {
      id
      name
      description
    }
  }
`;

export const UPDATE_DELIVERABLE_CMS_DOCUMENT_QUERY: TypedDocumentNode<
  { updateDeliverableCmsDocument: Document },
  { id: string; input: UpdateDocumentInput }
> = gql`
  mutation UpdateDeliverableCmsDocument($id: ID!, $input: UpdateDocumentInput!) {
    updateDeliverableCmsDocument(id: $id, input: $input) {
      id
      name
      description
    }
  }
`;

export const UPDATE_DELIVERABLE_STATE_DOCUMENT_QUERY: TypedDocumentNode<
  { updateDeliverableStateDocument: Document },
  { id: string; input: UpdateDocumentInput }
> = gql`
  mutation UpdateDeliverableStateDocument($id: ID!, $input: UpdateDocumentInput!) {
    updateDeliverableStateDocument(id: $id, input: $input) {
      id
      name
      description
    }
  }
`;

export const EditApplicationDocumentDialog: React.FC<{
  document: Document;
  refetchQueries?: DocumentNode[];
}> = ({ document, refetchQueries = [DEMONSTRATION_DETAIL_QUERY] }) => {
  const [updateDocument, { loading }] = useMutation<{ updateDocument: Document }>(
    UPDATE_DOCUMENT_QUERY
  );

  return (
    <EditDocumentDialogView
      document={document}
      saving={loading}
      onSubmit={(input) =>
        updateDocument({ variables: { id: document.id, input }, refetchQueries })
      }
    />
  );
};

export const EditDeliverableCmsDocumentDialog: React.FC<{
  document: Document;
  refetchQueries?: DocumentNode[];
}> = ({ document, refetchQueries = [DEMONSTRATION_DETAIL_QUERY] }) => {
  const [updateDeliverableCmsDocument, { loading }] = useMutation<{
    updateDeliverableCmsDocument: Document;
  }>(UPDATE_DELIVERABLE_CMS_DOCUMENT_QUERY);

  return (
    <EditDocumentDialogView
      document={document}
      saving={loading}
      onSubmit={(input) =>
        updateDeliverableCmsDocument({ variables: { id: document.id, input }, refetchQueries })
      }
    />
  );
};

export const EditDeliverableStateDocumentDialog: React.FC<{
  document: Document;
  refetchQueries?: DocumentNode[];
}> = ({ document, refetchQueries = [DEMONSTRATION_DETAIL_QUERY] }) => {
  const [updateDeliverableStateDocument, { loading }] = useMutation<{
    updateDeliverableStateDocument: Document;
  }>(UPDATE_DELIVERABLE_STATE_DOCUMENT_QUERY);

  return (
    <EditDocumentDialogView
      document={document}
      saving={loading}
      onSubmit={(input) =>
        updateDeliverableStateDocument({ variables: { id: document.id, input }, refetchQueries })
      }
    />
  );
};
