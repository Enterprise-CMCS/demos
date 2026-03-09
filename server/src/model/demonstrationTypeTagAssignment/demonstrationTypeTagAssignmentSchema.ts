import { DateTimeOrLocalDate, DemonstrationTypeStatus, Tag } from "../../types";
import { gql } from "graphql-tag";

export const demonstrationTypeTagAssignmentSchema = gql`
  scalar DemonstrationTypeStatus

  input DemonstrationTypeDatesInput {
    effectiveDate: DateTimeOrLocalDate!
    expirationDate: DateTimeOrLocalDate!
  }

  input DemonstrationTypeInput {
    demonstrationTypeName: Tag!
    demonstrationTypeDates: DemonstrationTypeDatesInput
  }

  input SetDemonstrationTypesInput {
    demonstrationId: ID!
    demonstrationTypes: [DemonstrationTypeInput!]!
  }

  type DemonstrationTypeAssignment {
    demonstrationTypeName: Tag!
      @auth(
        permissions: [
          "View Demonstration Types"
          "Manage Demonstration Types"
          "View Application Workflow"
          "Manage Application Workflow"
        ]
      )
    effectiveDate: DateTime!
      @auth(
        permissions: [
          "View Demonstration Types"
          "Manage Demonstration Types"
          "View Application Workflow"
          "Manage Application Workflow"
        ]
      )
    expirationDate: DateTime!
      @auth(
        permissions: [
          "View Demonstration Types"
          "Manage Demonstration Types"
          "View Application Workflow"
          "Manage Application Workflow"
        ]
      )
    status: DemonstrationTypeStatus!
      @auth(
        permissions: [
          "View Demonstration Types"
          "Manage Demonstration Types"
          "View Application Workflow"
          "Manage Application Workflow"
        ]
      )
    createdAt: DateTime!
      @auth(
        permissions: [
          "View Demonstration Types"
          "Manage Demonstration Types"
          "View Application Workflow"
          "Manage Application Workflow"
        ]
      )
    updatedAt: DateTime!
  }

  type Mutation {
    setDemonstrationTypes(input: SetDemonstrationTypesInput): Demonstration
      @auth(permissions: ["Manage Demonstration Types", "Manage Application Workflow"])
  }
`;

export interface DemonstrationTypeDatesInput {
  effectiveDate: DateTimeOrLocalDate;
  expirationDate: DateTimeOrLocalDate;
}

export interface DemonstrationTypeInput {
  demonstrationTypeName: Tag;
  demonstrationTypeDates: DemonstrationTypeDatesInput | null;
}

export interface SetDemonstrationTypesInput {
  demonstrationId: string;
  demonstrationTypes: DemonstrationTypeInput[];
}

export interface DemonstrationTypeAssignment {
  demonstrationTypeName: Tag;
  effectiveDate: Date;
  expirationDate: Date;
  status: DemonstrationTypeStatus;
  createdAt: Date;
  updatedAt: Date;
}
