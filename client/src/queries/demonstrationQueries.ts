import { gql } from "@apollo/client";

export const DEMONSTRATION_OPTIONS_QUERY = gql`
  query GetDemonstrationOptions {
    demonstrations {
      id
      name
    }
  }
`;

export const GET_ALL_DEMONSTRATIONS_QUERY = gql`
  query GetDemonstrations {
    demonstrations {
      id
      name
      description
      effectiveDate
      expirationDate
      state {
        id
        name
      }
      users {
        id
        fullName
      }
    }
  }
`;

export const GET_DEMONSTRATION_BY_ID_QUERY = gql`
  query GetDemonstration($id: ID!) {
    demonstration(id: $id) {
      id
      name
      description
      effectiveDate
      expirationDate
      state {
        id
        name
      }
      users {
        id
        fullName
      }
      projectOfficer {
        fullName
      }
    }
  }
`;

export const CREATE_DEMONSTRATION_MUTATION = gql`
  mutation CreateDemonstration($input: CreateDemonstrationInput!) {
    createDemonstration(input: $input) {
      success
      message
    }
  }
`;

export const UPDATE_DEMONSTRATION_MUTATION = gql`
  mutation UpdateDemonstration($id: ID!, $input: UpdateDemonstrationInput!) {
    updateDemonstration(id: $id, input: $input) {
      id
      name
      description
      effectiveDate
      expirationDate
      state {
        id
        name
      }
    }
  }
`;
