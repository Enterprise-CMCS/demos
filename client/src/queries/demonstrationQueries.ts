import { gql } from "@apollo/client";

export const GET_ALL_DEMONSTRATIONS_QUERY = gql`
  query GetDemonstrations {
    demonstrations {
      id
      name
      description
      effectiveDate
      expirationDate
      createdAt
      updatedAt
      demonstrationStatus {
        id
        name
      }
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

export const DEMONSTRATION_TABLE_QUERY = gql`
  query GetDemonstrations {
    demonstrations {
      id
      name
      demonstrationStatus {
        name
      }
      state {
        name
      }
      users {
        id
      }
      projectOfficer {
        fullName
      }
      amendments {
        name
        projectOfficer {
          fullName
        }
        amendmentStatus {
          name
        }
      }
      extensions {
        name
        projectOfficer {
          fullName
        }
        extensionStatus {
          name
        }
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
      createdAt
      updatedAt
      demonstrationStatus {
        id
        name
      }
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

export const ADD_DEMONSTRATION_QUERY = gql`
  mutation AddDemonstration($input: CreateDemonstrationInput!) {
    createDemonstration(input: $input) {
      id
      name
      description
      effectiveDate
      expirationDate
      createdAt
      updatedAt
      demonstrationStatus {
        id
        name
      }
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

export const UPDATE_DEMONSTRATION_MUTATION = gql`
  mutation UpdateDemonstration($id: ID!, $input: UpdateDemonstrationInput!) {
    updateDemonstration(id: $id, input: $input) {
      id
      name
      description
      effectiveDate
      expirationDate
      createdAt
      updatedAt
      demonstrationStatus {
        id
        name
      }
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
