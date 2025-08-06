import { gql } from "@apollo/client";

const DOCUMENT_FIELDS_FRAGMENT = gql`
  fragment DocumentFields on Document {
    id
    title
    description
    s3Path
    bundleType
    createdAt
    updatedAt
    owner {
      fullName
    }
    documentType {
      name
    }
    bundle {
      id
      name
    }
  }
`;

export const GET_ALL_DOCUMENTS_QUERY = gql`
  query GetAllDocuments {
    documents {
      ...DocumentFields
    }
  }
  ${DOCUMENT_FIELDS_FRAGMENT}
`;

export const GET_DOCUMENT_QUERY = gql`
  query GetDocument($id: ID!) {
    document(id: $id) {
      ...DocumentFields
    }
  }
  ${DOCUMENT_FIELDS_FRAGMENT}
`;

export const CREATE_DEMONSTRATION_DOCUMENT_MUTATION = gql`
  mutation CreateDemonstrationDocument($input: CreateDemonstrationDocumentInput!) {
    createDemonstrationDocument(input: $input) {
      ...DocumentFields
    }
  }
  ${DOCUMENT_FIELDS_FRAGMENT}
`;

export const UPDATE_DEMONSTRATION_DOCUMENT_MUTATION = gql`
  mutation UpdateDemonstrationDocument($id: ID!, $input: UpdateDemonstrationDocumentInput!) {
    updateDemonstrationDocument(id: $id, input: $input) {
      ...DocumentFields
    }
  }
  ${DOCUMENT_FIELDS_FRAGMENT}
`;

export const DELETE_DEMONSTRATION_DOCUMENTS_MUTATION = gql`
  mutation DeleteDemonstrationDocuments($ids: [ID!]!) {
    deleteDemonstrationDocuments(ids: $ids) {
      ids
    }
  }
`;
