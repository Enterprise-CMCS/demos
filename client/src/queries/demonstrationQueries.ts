import { gql } from "@apollo/client";

export const GET_ALL_DEMONSTRATIONS_QUERY = gql`
  query GetDemonstrations {
    demonstrations {
      id
      name
      description
      evaluationPeriodStartDate
      evaluationPeriodEndDate
      createdAt
      updatedAt
      projectOfficerUser {
        displayName
        email
        id
      }
      state {
        stateCode
        id
        stateName
      }
      demonstrationStatus {
        name
        id
        description
      }
      users {
        roles {
          name
          permissions {
            name
            id
            description
          }
        }
        email
        displayName
        fullName
        id
        states {
          stateCode
          stateName
          id
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
      evaluationPeriodStartDate
      evaluationPeriodEndDate
      createdAt
      updatedAt
      demonstrationStatus {
        id
        name
      }
      state {
        id
        stateName
        stateCode
      }
      users {
        id
        fullName
      }
      projectOfficerUser {
        id
        fullName
        displayName
      }
    }
  }
`;

export const ADD_DEMONSTRATION_QUERY = gql`
  mutation AddDemonstration($input: AddDemonstrationInput!) {
    addDemonstration(input: $input) {
      id
      name
      description
      evaluationPeriodStartDate
      evaluationPeriodEndDate
      createdAt
      updatedAt
      demonstrationStatus {
        id
        name
      }
      state {
        id
        stateName
        stateCode
      }
      users {
        id
        fullName
      }
    }
  }
`;
