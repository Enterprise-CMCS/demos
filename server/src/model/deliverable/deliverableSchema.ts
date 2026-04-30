import { gql } from "graphql-tag";
import {
  DateTimeOrLocalDate,
  DeliverableAction,
  DeliverableDueDateType,
  DeliverableExtensionReasonCode,
  DeliverableStatus,
  DeliverableType,
  Demonstration,
  Document,
  NonEmptyString,
  Tag,
  TagName,
  User,
} from "../../types";

export const deliverableSchema = gql`
  type Deliverable {
    id: ID!
    deliverableType: DeliverableType!
    name: NonEmptyString!
    demonstration: Demonstration!
    status: DeliverableStatus!
    cmsOwner: User!
    dueDate: DateTime!
    dueDateType: DeliverableDueDateType!
    demonstrationTypes: [Tag!]!
    expectedToBeSubmitted: Boolean!
    cmsDocuments: [Document!]!
    stateDocuments: [Document!]!
    deliverableActions: [DeliverableAction!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreateDeliverableInput {
    name: NonEmptyString!
    deliverableType: DeliverableType!
    demonstrationId: ID!
    cmsOwnerUserId: ID!
    dueDate: DateTimeOrLocalDate!
    demonstrationTypes: [TagName!]
  }

  input DeliverableDueDateUpdateInput {
    newDueDate: DateTimeOrLocalDate!
    dateChangeNote: NonEmptyString!
  }

  input UpdateDeliverableInput {
    name: NonEmptyString
    cmsOwnerUserId: ID
    dueDate: DeliverableDueDateUpdateInput
    demonstrationTypes: [TagName!]
  }

  input RequestDeliverableResubmissionInput {
    details: NonEmptyString!
    newDueDate: DateTimeOrLocalDate!
  }

  input RequestDeliverableExtensionInput {
    reason: DeliverableExtensionReasonCode!
    details: NonEmptyString!
    requestedDueDate: DateTimeOrLocalDate!
  }

  type Query {
    deliverable(id: ID!): Deliverable!
    deliverables: [Deliverable!]!
  }

  type Mutation {
    createDeliverable(input: CreateDeliverableInput): Deliverable
    updateDeliverable(id: ID!, input: UpdateDeliverableInput!): Deliverable
    submitDeliverable(id: ID!): Deliverable
    startDeliverableReview(id: ID!): Deliverable
    completeDeliverable(id: ID!, finalStatus: FinalDeliverableStatus!): Deliverable
    requestDeliverableResubmission(
      id: ID!
      input: RequestDeliverableResubmissionInput!
    ): Deliverable
    requestDeliverableExtension(id: ID!, input: RequestDeliverableExtensionInput): Deliverable
  }
`;

export interface Deliverable {
  id: string;
  deliverableType: DeliverableType;
  name: NonEmptyString;
  demonstration: Demonstration;
  status: DeliverableStatus;
  cmsOwner: User;
  dueDate: Date;
  dueDateType: DeliverableDueDateType;
  demonstrationTypes: Tag[];
  expectedToBeSubmitted: boolean;
  cmsDocuments: Document[];
  stateDocuments: Document[];
  deliverableActions: DeliverableAction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDeliverableInput {
  name: NonEmptyString;
  deliverableType: DeliverableType;
  demonstrationId: string;
  cmsOwnerUserId: string;
  dueDate: DateTimeOrLocalDate;
  demonstrationTypes?: TagName[];
}

export interface DeliverableDueDateUpdateInput {
  newDueDate: DateTimeOrLocalDate;
  dateChangeNote: NonEmptyString;
}

export interface UpdateDeliverableInput {
  name?: NonEmptyString;
  cmsOwnerUserId?: string;
  dueDate?: DeliverableDueDateUpdateInput;
  demonstrationTypes?: TagName[];
}

export interface RequestDeliverableResubmissionInput {
  details: NonEmptyString;
  newDueDate: DateTimeOrLocalDate;
}

export interface RequestDeliverableExtensionInput {
  reason: DeliverableExtensionReasonCode;
  details: NonEmptyString;
  requestedDueDate: DateTimeOrLocalDate;
}
