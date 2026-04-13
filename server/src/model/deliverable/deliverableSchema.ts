import { gql } from "graphql-tag";
import {
  DateTimeOrLocalDate,
  DeliverableDueDateType,
  DeliverableStatus,
  DeliverableType,
  Demonstration,
  Document,
  NonEmptyString,
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
    expectedToBeSubmitted: Boolean!
    cmsDocuments: [Document!]!
    stateDocuments: [Document!]!
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

  input UpdateDeliverableInput {
    name: NonEmptyString
    deliverableType: DeliverableType
    cmsOwnerUserId: ID
    dueDate: DateTimeOrLocalDate
    demonstrationTypes: [TagName!]
  }

  type Query {
    deliverables: [Deliverable!]!
  }

  type Mutation {
    createDeliverable(input: CreateDeliverableInput): Deliverable
    updateDeliverable(id: ID!, input: UpdateDeliverableInput!): Deliverable
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
  expectedToBeSubmitted: boolean;
  cmsDocuments: Document[];
  stateDocuments: Document[];
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

export interface UpdateDeliverableInput {
  name?: NonEmptyString;
  deliverableType?: DeliverableType;
  cmsOwnerUserId?: string;
  dueDate?: DateTimeOrLocalDate;
  demonstrationTypes?: TagName[];
}
