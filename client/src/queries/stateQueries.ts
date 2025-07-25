import { gql } from "@apollo/client";

export const STATE_OPTIONS_QUERY = gql`
  query GetStates {
    states {
      id
      name
    }
  }
`;
