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
    setApplicationDate(input: SetApplicationDateInput): Application!
      @auth(requires: ["Perform CMS Action"])
    setApplicationDates(input: SetApplicationDatesInput): Application!
      @auth(requires: ["Perform CMS Action"])
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
