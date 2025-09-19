import { gql } from "graphql-tag";

export const roleSchema = gql`
  """
  A string representing the status of a phase of an application. Expected values are:
  - State Point of Contact
  - DDME Analyst
  - Policy Technical Director
  - Monitoring & Evaluation Technical Director
  - All Users
  """
  scalar Role
`;
