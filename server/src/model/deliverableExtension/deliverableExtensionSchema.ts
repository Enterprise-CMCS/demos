import { gql } from "graphql-tag";
import { DeliverableExtensionReasonCode, DeliverableExtensionStatus } from "../../types";

export const deliverableExtensionSchema = gql`
  type DeliverableExtension {
    id: ID!
    status: DeliverableExtensionStatus!
    reasonCode: DeliverableExtensionReasonCode!
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
  originalDateRequested: Date;
  finalDateGranted: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
