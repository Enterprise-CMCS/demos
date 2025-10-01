import { gql } from "@apollo/client";

export const CREATE_AMENDMENT_MUTATION = gql`
  mutation CreateAmendment($input: CreateAmendmentInput!) {
    createAmendment(input: $input) {
      success
      message
      amendment {
        id
        name
        description
        effectiveDate
        expirationDate
        status
        currentPhaseName
        demonstration {
          id
          name
        }
      }
    }
  }
`;

export const GET_ALL_AMENDMENTS_QUERY = gql`
  query GetAmendments {
    amendments {
      id
      name
      description
      effectiveDate
      expirationDate
      status
      currentPhase
      demonstration {
        id
        name
      }
    }
  }
`;

export const GET_AMENDMENT_BY_ID_QUERY = gql`
  query GetAmendment($id: ID!) {
    amendment(id: $id) {
      id
      name
      description
      effectiveDate
      expirationDate
      status
      currentPhase
      demonstration {
        id
        name
      }
    }
  }
`;

export const UPDATE_AMENDMENT_MUTATION = gql`
  mutation UpdateAmendment($id: ID!, $input: UpdateAmendmentInput!) {
    updateAmendment(id: $id, input: $input) {
      id
      name
      description
      effectiveDate
      expirationDate
      status
      currentPhase
      demonstration {
        id
        name
      }
    }
  }
`;
