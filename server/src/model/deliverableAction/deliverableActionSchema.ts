import { gql } from "graphql-tag";
import { DeliverableActionType, NonEmptyString } from "../../types";

// Note that details is a constructed field and is explicitly permitted to be empty string
export const deliverableActionSchema = gql`
  type DeliverableAction {
    id: ID!
    actionTimestamp: DateTime!
    actionType: DeliverableActionType!
    userFullName: NonEmptyString!
    details: String!
  }
`;

export interface DeliverableAction {
  id: string;
  actionTimestamp: Date;
  actionType: DeliverableActionType;
  userFullName: NonEmptyString;
  details: string;
}
