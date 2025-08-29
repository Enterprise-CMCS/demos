import gql from "graphql-tag";

export const contactTypeSchema = gql`
  """
  A string representing a contact type. Expected values are:
  - Project Officer
  - State Point of Contact
  - DDME Analyst
  - Policy Technical Director
  - Monitoring & Evaluation Technical Director
  """
  scalar ContactType
`;

export const CONTACT_TYPES = [
  "Project Officer",
  "State Point of Contact",
  "DDME Analyst",
  "Policy Technical Director",
  "Monitoring & Evaluation Technical Director",
] as const;

export type ContactType = (typeof CONTACT_TYPES)[number];
