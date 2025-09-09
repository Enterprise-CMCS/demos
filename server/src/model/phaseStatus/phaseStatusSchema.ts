import gql from "graphql-tag";

export const phaseStatusSchema = gql`
  """
  A string representing the status of a phase of an application. Expected values are:
  - Not Started
  - Started
  - Completed
  - Skipped
  """
  scalar PhaseStatus
`;
