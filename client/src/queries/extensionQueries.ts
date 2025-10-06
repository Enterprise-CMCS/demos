import { gql } from "@apollo/client";

export const CREATE_EXTENSION_MUTATION = gql`
  mutation CreateExtension($input: CreateExtensionInput!) {
    createExtension(input: $input) {
      id
      name
      description
      effectiveDate
      expirationDate
      demonstration {
        id
        name
      }
      status
    }
  }
`;

export const GET_ALL_EXTENSIONS_QUERY = gql`
  query GetExtensions {
    extensions {
      id
      name
      description
      effectiveDate
      expirationDate
      demonstration {
        id
        name
      }
      status
    }
  }
`;

export const GET_EXTENSION_BY_ID_QUERY = gql`
  query GetExtension($id: ID!) {
    extension(id: $id) {
      id
      name
      description
      effectiveDate
      expirationDate
      demonstration {
        id
        name
      }
      status
    }
  }
`;

export const UPDATE_EXTENSION_MUTATION = gql`
  mutation UpdateExtension($id: ID!, $input: UpdateExtensionInput!) {
    updateExtension(id: $id, input: $input) {
      id
      name
      description
      effectiveDate
      expirationDate
      demonstration {
        id
        name
      }
      status
    }
  }
`;
