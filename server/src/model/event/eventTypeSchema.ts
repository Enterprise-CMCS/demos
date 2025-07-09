import { gql } from "graphql-tag";

/**
 * EventType represents a type of event that can be logged from the UI.
 * This is a fact / reference table and it should be populated via DDL /
 * migrations rather than created dynamically through the UI.
 */
export const eventTypeSchema = gql`
  type EventType {
    id: ID! # A natural key, doubles as the "name" of the event
    description: String! # A description of what this event type represents
  }

  type Query {
    eventTypes: [EventType!]!
    eventType(id: ID!): EventType
  }
`;
