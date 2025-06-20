import { gql } from "@apollo/client";

export const GET_ALL_DEMONSTRATIONS = gql`
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

export const GET_DEMONSTRATION_BY_ID = gql`
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

export const ADD_DEMONSTRATION = gql`
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

export const UPDATE_DEMONSTRATION = gql`
  mutation UpdateDemonstration($id: ID!, $input: UpdateDemonstrationInput!) {
    updateDemonstration(id: $id, input: $input) {
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

export const DELETE_DEMONSTRATION = gql`
  mutation DeleteDemonstration($id: ID!) {
    deleteDemonstration(id: $id) {
      id
      name
    }
  }
`;
