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
    demonstrationTypeName: TagName! @auth(requires: "Resolve DemonstrationTypeAssignment")
    effectiveDate: DateTime! @auth(requires: "Resolve DemonstrationTypeAssignment")
    expirationDate: DateTime! @auth(requires: "Resolve DemonstrationTypeAssignment")
    status: DemonstrationTypeStatus! @auth(requires: "Resolve DemonstrationTypeAssignment")
    approvalStatus: TagStatus! @auth(requires: "Resolve DemonstrationTypeAssignment")
    createdAt: DateTime! @auth(requires: "Resolve DemonstrationTypeAssignment")
    updatedAt: DateTime! @auth(requires: "Resolve DemonstrationTypeAssignment")
  }

  type Mutation {
    setDemonstrationTypes(input: SetDemonstrationTypesInput): Demonstration
      @auth(requires: "Mutate Demonstration Types")
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
