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
