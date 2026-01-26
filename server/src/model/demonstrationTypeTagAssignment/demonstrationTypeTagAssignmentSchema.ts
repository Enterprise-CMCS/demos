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
    effectiveDate: DateTime!
    expirationDate: DateTime!
    status: DemonstrationTypeStatus!
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
