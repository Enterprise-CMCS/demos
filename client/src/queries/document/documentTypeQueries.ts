import { gql } from "@apollo/client";

export const DOCUMENT_TYPE_FIELDS_FRAGMENT = gql`
  fragment DocumentTypeFields on DocumentType {
    id
    name
    description
    createdAt
    updatedAt
  }
`;

export const GET_ALL_DOCUMENT_TYPES = gql`
  query GetAllDocumentTypes {
    documentTypes {
      ...DocumentTypeFields
    }
  }
  ${DOCUMENT_TYPE_FIELDS_FRAGMENT}
`;
