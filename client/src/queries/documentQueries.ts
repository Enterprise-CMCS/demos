import { gql } from "@apollo/client";

export const DELETE_DOCUMENTS_QUERY = gql`
  mutation DeleteDocuments($ids: [ID!]!) {
    deleteDocuments(ids: $ids)
  }
`;

export const UPLOAD_DOCUMENT_QUERY = gql`
  mutation UploadDocument($input: UploadDocumentInput!) {
    uploadDocument(input: $input) {
      presignedURL
    }
  }
`;

// title needs to be name. (TO BE DONE WITH EDITDOCUMENT UPDATES)
export const UPDATE_DOCUMENT_QUERY = gql`
  mutation UpdateDocument($input: UpdateDocumentInput!) {
    updateDocument(input: $input) {
      id
      name
      description
      documentType
    }
  }
`;
