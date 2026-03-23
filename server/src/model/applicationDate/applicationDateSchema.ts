import { gql } from "graphql-tag";
import { DateTimeOrLocalDate, DateType } from "../../types.js";

export const applicationDateSchema = gql`
  type ApplicationDate {
    dateType: DateType! @auth(requires: "Resolve ApplicationDate")
    dateValue: DateTime! @auth(requires: "Resolve ApplicationDate")
    createdAt: DateTime! @auth(requires: "Resolve ApplicationDate")
    updatedAt: DateTime! @auth(requires: "Resolve ApplicationDate")
  }

  input ApplicationDateInput {
    dateType: DateType!
    dateValue: DateTimeOrLocalDate
  }

  input SetApplicationDateInput {
    applicationId: ID!
    dateType: DateType!
    dateValue: DateTimeOrLocalDate
  }

  input SetApplicationDatesInput {
    applicationId: ID!
    applicationDates: [ApplicationDateInput!]!
  }

  type Mutation {
    setApplicationDate(input: SetApplicationDateInput): Application
      @auth(requires: "Mutate Application Workflow")
    setApplicationDates(input: SetApplicationDatesInput): Application
      @auth(requires: "Mutate Application Workflow")
  }
`;

export interface SetApplicationDateInput {
  applicationId: string;
  dateType: DateType;
  dateValue: DateTimeOrLocalDate | null;
}

export interface ApplicationDateInput {
  dateType: DateType;
  dateValue: DateTimeOrLocalDate | null;
}

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
