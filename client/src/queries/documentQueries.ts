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
