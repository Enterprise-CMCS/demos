import { gql } from "graphql-tag";
import { DateType, LocalDate } from "../../types.js";

export const applicationDateSchema = gql`
  type ApplicationDate {
    dateType: DateType!
    plainDate: LocalDate!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input ApplicationDateInput {
    dateType: DateType!
    plainDate: LocalDate
  }

  input SetApplicationDateInput {
    applicationId: ID!
    dateType: DateType!
    plainDate: LocalDate
  }

  input SetApplicationDatesInput {
    applicationId: ID!
    applicationDates: [ApplicationDateInput!]!
  }

  type Mutation {
    setApplicationDate(input: SetApplicationDateInput): Application!
      @auth(requires: ["Modify Applications"])
    setApplicationDates(input: SetApplicationDatesInput): Application!
      @auth(requires: ["Modify Applications"])
  }
`;

export interface SetApplicationDateInput {
  applicationId: string;
  dateType: DateType;
  plainDate: LocalDate | null;
}

export interface ApplicationDateInput {
  dateType: DateType;
  plainDate: LocalDate | null;
}

export interface SetApplicationDatesInput {
  applicationId: string;
  applicationDates: ApplicationDateInput[];
}

export interface ApplicationDate {
  dateType: DateType;
  plainDate: LocalDate;
  createdAt: Date;
  updatedAt: Date;
}
