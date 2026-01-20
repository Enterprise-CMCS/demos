import { Tag } from "../../types.js";
import { gql } from "graphql-tag";

export const demonstrationTypeTagAssignmentSchema = gql`
  type DemonstrationTypeAssignment {
    demonstrationType: Tag!
    effectiveDate: DateTime!
    expirationDate: DateTime!
    createdAt: DateTime!
    updatedAt: DateTime!
  }
`;

export interface DemonstrationTypeAssignment {
  demonstrationType: Tag;
  effectiveDate: Date;
  expirationDate: Date;
  createdAt: Date;
  updatedAt: Date;
}
