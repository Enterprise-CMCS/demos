import { gql, useMutation } from "@apollo/client";

const UPSERT_USER = gql`
  mutation UpsertUser($input: UpsertUserInput!) {
    upsertUser(input: $input) {
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

export function useUpsertUser() {
  return useMutation(UPSERT_USER);
}
