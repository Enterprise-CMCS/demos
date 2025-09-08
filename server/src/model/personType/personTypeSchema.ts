import { gql } from "graphql-tag";

export const personTypeSchema = gql`
  """
  A string representing a document type. Expected values are:
  - demos-admin
  - demos-cms-user
  - demos-state-user
  - non-user-contact
  """
  scalar PersonType
`;

