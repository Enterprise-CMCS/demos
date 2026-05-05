import { gql } from "graphql-tag";
import {
  DeliverableExtensionReasonCode,
  DeliverableExtensionStatus,
  NonEmptyString,
} from "../../types";

export const deliverableExtensionSchema = gql`
  type DeliverableExtension {
    id: ID!
    status: DeliverableExtensionStatus!
    reasonCode: DeliverableExtensionReasonCode!
    reasonDetails: NonEmptyString!
    initialDueDateAtRequest: DateTime!
    originalDateRequested: DateTime!
    finalDateGranted: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }
`;

export interface DeliverableExtension {
  id: string;
  status: DeliverableExtensionStatus;
  reasonCode: DeliverableExtensionReasonCode;
  reasonDetails: NonEmptyString;
  initialDueDateAtRequest: Date;
  originalDateRequested: Date;
  finalDateGranted?: Date;
  createdAt: Date;
  updatedAt: Date;
}
