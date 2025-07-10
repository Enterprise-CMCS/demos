import { gql } from "graphql-tag";

export const eventSchema = gql`
  """
  Event represents a user action or system event, mirroring DB structure
  """
  type Event {
    id: ID!
    userId: ID!
    eventTypeId: ID!
    createdAt: DateTime!
    """
    Event-specific data structure depends on eventType
    
    Maximum size: 4KB
    Characters: ~4,096 characters
    Records per GB: ~262,144 records
    """
    eventData: JSONObject!
  }

  type EventHydrated {
    id: ID!
    user: User!
    eventType: EventType!
    createdAt: DateTime!
    eventData: JSONObject!
  }

  type Query {
    events: [EventHydrated!]!
    event(id: ID!): EventHydrated
    eventsByType(eventTypeId: ID!): [EventHydrated!]!
    eventsByUser(userId: ID!): [EventHydrated!]!
  }
  
  type Mutation {
    createEvent(input: CreateEventInput!): EventHydrated!
  }

  input CreateEventInput {
    userId: ID!
    eventTypeId: ID!
    eventData: JSONObject!
  }
`;

type DateTime = Date;
export interface Event {
  id: string;
  userId: string;
  eventTypeId: string;
  createdAt: DateTime;
  eventData: object;
}

export interface CreateEventInput {
  userId: string;
  eventTypeId: string;
  eventData: object;
}
