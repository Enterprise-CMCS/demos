import { gql } from "graphql-tag";
import { DateTimeOrLocalDate, DateType } from "../../types.js";

export const applicationDateSchema = gql`
  type ApplicationDate {
    dateType: DateType!
    dateValue: DateTime!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input ApplicationDateInput {
    dateType: DateType!
    dateValue: DateTimeOrLocalDate!
  }

  input SetApplicationDateInput {
    applicationId: ID!
    dateType: DateType!
    dateValue: DateTimeOrLocalDate!
  }

  input SetApplicationDatesInput {
    applicationId: ID!
    applicationDates: [ApplicationDateInput!]!
  }

  type Mutation {
    setApplicationDate(input: SetApplicationDateInput): Application
    setApplicationDates(input: SetApplicationDatesInput): Application
  }
`;

export interface SetApplicationDateInput {
  applicationId: string;
  dateType: DateType;
  dateValue: DateTimeOrLocalDate;
}

export interface ApplicationDateInput {
  dateType: DateType;
  dateValue: DateTimeOrLocalDate;
}

export interface SetApplicationDatesInput {
  applicationId: string;
  applicationDates: ApplicationDateInput[];
}

export interface ParsedApplicationDateInput {
  dateType: DateType;
  dateValue: Date;
}

export interface ParsedSetApplicationDatesInput {
  applicationId: string;
  applicationDates: ParsedApplicationDateInput[];
}

export interface ApplicationDate {
  dateType: DateType;
  dateValue: Date;
  createdAt: Date;
  updatedAt: Date;
}
