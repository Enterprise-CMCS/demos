import { gql } from "graphql-tag";

export type EventTypeId =
  | 'LOGIN_SUCCEEDED'
  | 'LOGOUT_SUCCEEDED'
  | 'CREATE_DEMONSTRATION_SUCCEEDED'
  | 'CREATE_DEMONSTRATION_FAILED'
  | 'CREATE_EXTENSION_SUCCEEDED'
  | 'CREATE_EXTENSION_FAILED'
  | 'CREATE_AMENDMENT_SUCCEEDED'
  | 'CREATE_AMENDMENT_FAILED'
  | 'EDIT_DEMONSTRATION_SUCCEEDED'
  | 'EDIT_DEMONSTRATION_FAILED'
  | 'DELETE_DEMONSTRATION_SUCCEEDED'
  | 'DELETE_DEMONSTRATION_FAILED'
  | 'DELETE_DOCUMENT_SUCCEEDED'
  | 'DELETE_DOCUMENT_FAILED'

/**
 * EventType represents a type of event that can be logged from the UI.
 * This is a fact / reference table and it should be maintained via
 * migrations rather than created dynamically through the UI.
 */
export const eventTypeSchema = gql`
  type EventType {
    id: ID! # A natural key, doubles as the "name" of the event
    description: String! # A description of what this event type represents
    logLevel: String! # The log level associated with this event type
  }

  type Query {
    eventTypes: [EventType!]!
    eventType(id: ID!): EventType
  }
`;

export interface EventType {
  id: string;
  description: string;
  logLevel: string;
}
