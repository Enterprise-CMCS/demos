import gql from "graphql-tag";

export const cmcsDivisionSchema = gql`
  """
  A string representing a CMCS division. Expected values are:
  - Division of System Reform Demonstrations
  - Division of Eligibility and Coverage Demonstrations
  """
  scalar CmcsDivision
`;

export const CMCS_DIVISION = [
  "Division of System Reform Demonstrations",
  "Division of Eligibility and Coverage Demonstrations",
] as const;

export type CmcsDivision = (typeof CMCS_DIVISION)[number];
