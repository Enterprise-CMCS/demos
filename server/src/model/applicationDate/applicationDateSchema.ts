import { gql } from "graphql-tag";
import { DateType } from "../../types.js";

export const applicationDateSchema = gql`
  type ApplicationDate {
    dateType: DateType!
    dateValue: DateTime!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input SetApplicationDateInput {
    applicationId: ID!
    dateType: DateType!
    dateValue: DateTime!
  }

  type Mutation {
    setApplicationDate(input: SetApplicationDateInput): Application
  }
`;

export interface SetApplicationDateInput {
  applicationId: string;
  dateType: DateType;
  dateValue: Date;
}

export interface ApplicationDate {
  dateType: DateType;
  dateValue: Date;
  createdAt: Date;
  updatedAt: Date;
}
