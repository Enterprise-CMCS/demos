import { gql } from "graphql-tag";
import { ApplicationActionType, NonEmptyString } from "../../types";

// Note that details is a constructed field and is explicitly permitted to be empty string
export const applicationActionSchema = gql`
  type ApplicationAction {
    id: ID!
    actionTimestamp: DateTime!
    actionType: ApplicationActionType!
    userFullName: NonEmptyString!
    details: String!
  }
`;

export interface ApplicationAction {
  id: string;
  actionTimestamp: Date;
  actionType: ApplicationActionType;
  userFullName: NonEmptyString;
  details: string;
}
