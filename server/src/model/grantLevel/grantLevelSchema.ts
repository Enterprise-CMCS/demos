import { gql } from "graphql-tag";

export const grantLevelSchema = gql`
  """
  A string representing a permissions grant level. Expected values are:
  - System
  - Demonstration
  """
  scalar GrantLevel
`;
