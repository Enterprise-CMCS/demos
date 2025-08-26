import { gql } from "@apollo/client";

export const GET_CURRENT_USER_QUERY = gql`
  query GetCurrentUser {
    currentUser {
      id
      cognitoSubject
      username
      email
      fullName
      displayName
      roles {
        id
        name
      }
    }
  }
`;
