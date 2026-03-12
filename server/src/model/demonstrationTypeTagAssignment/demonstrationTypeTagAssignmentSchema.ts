import { DateTimeOrLocalDate, DemonstrationTypeStatus, TagName, TagStatus } from "../../types";
import { gql } from "graphql-tag";

export const demonstrationTypeTagAssignmentSchema = gql`
  scalar DemonstrationTypeStatus

  input DemonstrationTypeDatesInput {
    effectiveDate: DateTimeOrLocalDate!
    expirationDate: DateTimeOrLocalDate!
  }

  input DemonstrationTypeInput {
    demonstrationTypeName: TagName!
    demonstrationTypeDates: DemonstrationTypeDatesInput
  }

  input SetDemonstrationTypesInput {
    demonstrationId: ID!
    demonstrationTypes: [DemonstrationTypeInput!]!
  }

  type DemonstrationTypeAssignment {
    demonstrationTypeName: TagName!
    effectiveDate: DateTime!
    expirationDate: DateTime!
    status: DemonstrationTypeStatus!
    approvalStatus: TagStatus!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Mutation {
    setDemonstrationTypes(input: SetDemonstrationTypesInput): Demonstration
  }
`;

export interface DemonstrationTypeDatesInput {
  effectiveDate: DateTimeOrLocalDate;
  expirationDate: DateTimeOrLocalDate;
}

export interface DemonstrationTypeInput {
  demonstrationTypeName: TagName;
  demonstrationTypeDates: DemonstrationTypeDatesInput | null;
}

export interface SetDemonstrationTypesInput {
  demonstrationId: string;
  demonstrationTypes: DemonstrationTypeInput[];
}

export interface DemonstrationTypeAssignment {
  demonstrationTypeName: TagName;
  effectiveDate: Date;
  expirationDate: Date;
  status: DemonstrationTypeStatus;
  approvalStatus: TagStatus;
  createdAt: Date;
  updatedAt: Date;
}
