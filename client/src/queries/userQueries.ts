import { gql } from "@apollo/client";

export const USER_OPTIONS_QUERY = gql`
  query userOptions {
    users {
      fullName
    }
  }
`;
