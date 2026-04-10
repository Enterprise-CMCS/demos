import { gql } from "graphql-tag";
import {
  DeliverableDueDateType,
  DeliverableStatus,
  DeliverableType,
  Demonstration,
  Document,
  User,
} from "../../types";

export const deliverableSchema = gql`
  type Deliverable {
    id: ID!
    deliverableType: DeliverableType!
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

  type Query {
    deliverables: [Deliverable!]!
  }
`;

export interface Deliverable {
  id: string;
  deliverableType: DeliverableType;
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
