import { gql } from "graphql-tag";
import { DeliverableActionType, NonEmptyString, User } from "../../types";

export const deliverableActionSchema = gql`
  type DeliverableAction {
    id: ID!
    actionTimestamp: DateTime!
    actionType: DeliverableActionType!
    user: User
    note: NonEmptyString
  }
`;

export interface DeliverableAction {
  id: string;
  actionTimestamp: Date;
  actionType: DeliverableActionType;
  user?: User | null;
  note?: NonEmptyString | null;
}
