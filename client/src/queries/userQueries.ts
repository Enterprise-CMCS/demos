import { gql } from "@apollo/client";

export const USER_OPTIONS_QUERY = gql`
  query userOptions {
    users {
      fullName
    }
  }
`;

export const GET_USER_BY_COGNITO_SUBJECT = gql`
  query GetUserByCognitoSubject($cognitoSubject: String!) {
    userByCognitoSubject(cognitoSubject: $cognitoSubject) {
      id
      cognito_subject
      username
      email
      full_name
      display_name
      created_at
      updated_at
    }
  }
`;
