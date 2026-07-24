import { gql } from "@apollo/client";

export const DEMONSTRATION_AMENDMENTS_QUERY = gql`
  query GetDemonstrationAmendments($id: ID!) {
    demonstration(id: $id) {
      id
      amendments {
        id
        name
        createdAt
      }
    }
  }
`;

export const DEMONSTRATION_EXTENSIONS_QUERY = gql`
  query GetDemonstrationExtensions($id: ID!) {
    demonstration(id: $id) {
      id
      extensions {
        id
        name
        createdAt
      }
    }
  }
`;
