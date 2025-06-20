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
