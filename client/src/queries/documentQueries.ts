import { gql } from "@apollo/client";

export const DOCUMENT_TABLE_QUERY = gql`
  query DocumentTable {
    documents {
      id
      title
      description
      documentType {
        name
      }
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
