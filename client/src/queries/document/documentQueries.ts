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

export const ADD_DEMONSTRATION_DOCUMENT_MUTATION = gql`
  mutation AddDemonstrationDocument($input: AddDocumentInput!) {
    addDemonstrationDocument(input: $input) {
      ...DocumentFields
    }
  }
  ${DOCUMENT_FIELDS_FRAGMENT}
`;

export const UPDATE_DEMONSTRATION_DOCUMENT_MUTATION = gql`
  mutation UpdateDemonstrationDocument($id: ID!, $input: UpdateDocumentInput!) {
    updateDemonstrationDocument(id: $id, input: $input) {
      ...DocumentFields
    }
  }
  ${DOCUMENT_FIELDS_FRAGMENT}
`;

export const DELETE_DEMONSTRATION_DOCUMENT_MUTATION = gql`
  mutation DeleteDemonstrationDocument($id: ID!) {
    deleteDemonstrationDocument(id: $id) {
      id
    }
  }
`;

export const ADD_AMENDMENT_DOCUMENT_MUTATION = gql`
  mutation AddAmendmentDocument($input: AddDocumentInput!) {
    addAmendmentDocument(input: $input) {
      ...DocumentFields
    }
  }
  ${DOCUMENT_FIELDS_FRAGMENT}
`;

export const UPDATE_AMENDMENT_DOCUMENT_MUTATION = gql`
  mutation UpdateAmendmentDocument($id: ID!, $input: UpdateDocumentInput!) {
    updateAmendmentDocument(id: $id, input: $input) {
      ...DocumentFields
    }
  }
  ${DOCUMENT_FIELDS_FRAGMENT}
`;

export const DELETE_AMENDMENT_DOCUMENT_MUTATION = gql`
  mutation DeleteAmendmentDocument($id: ID!) {
    deleteAmendmentDocument(id: $id) {
      id
    }
  }
`;
