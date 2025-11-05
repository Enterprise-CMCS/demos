import { gql } from "graphql-tag";
import { DateType } from "../../types.js";

export const applicationDateSchema = gql`
  type ApplicationDate {
    dateType: DateType!
    dateValue: DateTime!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input ApplicationDateInput {
    dateType: DateType!
    dateValue: DateTime!
  }

  input SetApplicationDatesInput {
    applicationId: ID!
    applicationDates: [ApplicationDateInput!]!
  }

  type Mutation {
    setApplicationDates(input: SetApplicationDatesInput): Application
  }
`;

export type ApplicationDateInput = {
  dateTypeId: DateType;
  dateValue: Date;
};

export interface SetApplicationDatesInput {
  applicationId: string;
  applicationDates: ApplicationDateInput[];
}

export interface ApplicationDate {
  dateType: DateType;
  dateValue: Date;
  createdAt: Date;
  updatedAt: Date;
}
