import { gql } from "@apollo/client";

export const DOCUMENT_TYPE_OPTIONS_QUERY = gql`
  query GetDocumentTypeOptions {
    documentTypes {
      name
    }
  }
`;
