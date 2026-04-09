import { TagName } from "../../types";
import { gql } from "graphql-tag";

export const deliverableDemonstrationTypeSchema = gql`
  input SetDeliverableDemonstrationTypesInput {
    deliverableId: ID!
    demonstrationId: ID!
    demonstrationTypes: [TagName!]!
  }

  type Mutation {
    setDeliverableDemonstrationTypes(input: SetDeliverableDemonstrationTypesInput): Deliverable
  }
`;

export interface SetDeliverableDemonstrationTypesInput {
  deliverableId: string;
  demonstrationId: string;
  demonstrationTypes: TagName[];
}
