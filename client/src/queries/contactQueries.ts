import { gql } from "@apollo/client";

export const SEARCH_PEOPLE_QUERY = gql`
  query SearchPeople($search: String!) {
    searchPeople(search: $search) {
      id
      firstName
      lastName
      email
      personType
    }
  }
`;

export const SET_DEMONSTRATION_ROLE_MUTATION = gql`
  mutation SetDemonstrationRoles($input: [SetDemonstrationRoleInput!]!) {
    setDemonstrationRoles(input: $input) {
      role
    }
  }
`;

export const UNSET_DEMONSTRATION_ROLES_MUTATION = gql`
  mutation UnsetDemonstrationRoles($input: [UnsetDemonstrationRoleInput!]!) {
    unsetDemonstrationRoles(input: $input) {
      role
    }
  }
`;

export const DEMONSTRATION_DETAIL_QUERY = gql`
  query DemonstrationDetailQuery($id: ID!) {
    demonstration(id: $id) {
      id
      status
      currentPhaseName
      amendments {
        id
        name
        effectiveDate
        status
      }
      extensions {
        id
        name
        effectiveDate
        status
      }
      documents {
        id
        name
        description
        documentType
        phaseName
        createdAt
        owner {
          person {
            fullName
          }
        }
      }
      roles {
        role
        isPrimary
        person {
          id
          fullName
          email
        }
      }
    }
  }
`;

export const GET_DEMONSTRATION_BY_ID_QUERY = gql`
  query GetDemonstrationById($id: ID!) {
    demonstration(id: $id) {
      id
      name
      description
      state {
        id
        name
      }
      roles {
        isPrimary
        role
        person {
          id
          fullName
        }
      }
    }
  }
`;

export const DEMONSTRATION_HEADER_DETAILS_QUERY = gql`
  query DemonstrationHeaderDetails($demonstrationId: ID!) {
    demonstration(id: $demonstrationId) {
      id
      name
      expirationDate
      effectiveDate
      status
      state {
        id
      }
      primaryProjectOfficer {
        id
        fullName
      }
    }
  }
`;
