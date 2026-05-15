import { gql } from "graphql-tag";
import {
  DateTimeOrLocalDate,
  DeliverableAction,
  DeliverableComment,
  DeliverableDueDateType,
  DeliverableExtension,
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
    extensionRequests: [DeliverableExtension!]!
    publicComments: [DeliverableComment!]!
    privateComments: [DeliverableComment!]! @auth(requires: ["Access CMS Field"])
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

  input ApproveDeliverableExtensionInput {
    deliverableExtensionId: ID!
    newDueDate: DateTimeOrLocalDate
  }

  input DenyDeliverableExtensionInput {
    deliverableExtensionId: ID!
    details: NonEmptyString!
  }

  type Query {
    deliverable(id: ID!): Deliverable!
    deliverables: [Deliverable!]!
  }

  type Mutation {
    createDeliverable(input: CreateDeliverableInput): Deliverable
      @auth(requires: ["Perform CMS Action"])
    updateDeliverable(id: ID!, input: UpdateDeliverableInput!): Deliverable
      @auth(requires: ["Perform CMS Action"])
    submitDeliverable(id: ID!): Deliverable
      @auth(requires: ["Perform CMS Action", "Perform State Action"])
    startDeliverableReview(id: ID!): Deliverable @auth(requires: ["Perform CMS Action"])
    completeDeliverable(id: ID!, finalStatus: FinalDeliverableStatus!): Deliverable
      @auth(requires: ["Perform CMS Action"])
    requestDeliverableResubmission(
      id: ID!
      input: RequestDeliverableResubmissionInput!
    ): Deliverable @auth(requires: ["Perform CMS Action"])
    requestDeliverableExtension(
      deliverableId: ID!
      input: RequestDeliverableExtensionInput!
    ): Deliverable @auth(requires: ["Perform State Action"])
    approveDeliverableExtension(
      deliverableId: ID!
      input: ApproveDeliverableExtensionInput!
    ): Deliverable @auth(requires: ["Perform CMS Action"])
    denyDeliverableExtension(
      deliverableId: ID!
      input: DenyDeliverableExtensionInput!
    ): Deliverable @auth(requires: ["Perform CMS Action"])
    deleteDeliverable(id: ID!): Deliverable @auth(requires: ["Perform CMS Action"])
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
  extensionRequests: DeliverableExtension[];
  publicComments: DeliverableComment[];
  privateComments: DeliverableComment[];
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

export interface ApproveDeliverableExtensionInput {
  deliverableExtensionId: string;
  newDueDate?: DateTimeOrLocalDate;
}

export interface DenyDeliverableExtensionInput {
  deliverableExtensionId: string;
  details: NonEmptyString;
}
