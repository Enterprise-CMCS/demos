import { gql } from "@apollo/client";

export const DOCUMENT_TABLE_QUERY = gql`
  query DocumentTable {
    documents {
      id
      title
      description
      documentType
      owner {
        fullName
      }
      createdAt
    }
  }
`;

export const DELETE_DOCUMENTS_QUERY = gql`
  mutation DeleteDocuments($ids: [ID!]!) {
    deleteDocuments(ids: $ids)
  }
`;

export const UPLOAD_DOCUMENT_QUERY = gql`
  mutation UploadDocument($input: UploadDocumentInput!) {
    uploadDocument(input: $input) {
      id
      title
      description
      documentType
    }
  }
`;

export const UPDATE_DOCUMENT_QUERY = gql`
  mutation UpdateDocument($input: UpdateDocumentInput!) {
    updateDocument(input: $input) {
      id
      title
      description
      documentType
    }
  }
`;
