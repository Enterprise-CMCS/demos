import gql from "graphql-tag";

export const phaseSchema = gql`
  """
  A string representing a phase of an application. Expected values are:
  - None (only used for documents attached directly to an application)
  - Concept
  - State Application
  - Completeness
  """
  scalar Phase
`;
