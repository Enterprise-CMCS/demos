import gql from "graphql-tag";

export const dateTypeSchema = gql`
  """
  A string representing a kind of date for a phase. Acceptable values are:
  - Start Date
  - Completion Date
  - Pre-Submission Submitted Date
  - State Application Submitted Date
  - Completeness Review Due Date
  - Completeness Due Date
  - State Application Deemed Complete
  - Federal Comment Period Start Date
  - Federal Comment Period End Date
  """
  scalar DateType
`;
