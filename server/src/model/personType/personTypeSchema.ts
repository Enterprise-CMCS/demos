import { gql } from "graphql-tag";

export const PERSON_TYPES = [
  "demos-admin",
  "demos-cms-user",
  "demos-state-user",
  "non-user-contact",
] as const;

export const personTypeSchema = gql`
  """
  A string representing a document type. Expected values are:
  - demos-admin
  - demos-cms-user
  - demos-state-user
  - non-user-contact
  """
  scalar DocumentType
`;

export type PersonType = (typeof PERSON_TYPES)[number];
