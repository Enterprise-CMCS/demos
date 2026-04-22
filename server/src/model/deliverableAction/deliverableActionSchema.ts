import { gql } from "graphql-tag";
import { DeliverableActionType, NonEmptyString } from "../../types";

export const deliverableActionSchema = gql`
  type DeliverableAction {
    id: ID!
    actionTimestamp: DateTime!
    actionType: DeliverableActionType!
    userFullName: NonEmptyString
    details: NonEmptyString
  }
`;

export interface DeliverableAction {
  id: string;
  actionTimestamp: Date;
  actionType: DeliverableActionType;
  userFullName?: NonEmptyString | null;
  details?: NonEmptyString | null;
}
