import { gql } from "graphql-tag";

export const eventSchema = gql`
  """
  Event represents a user action or system event, mirroring DB structure
  """
  type Event {
    id: ID!
    userId: ID!
    eventTypeId: ID!
    withRoleId: ID!
    route: String!
    createdAt: DateTime!
    eventData: JSONObject!
  }

  # An event with all the fields populated for easier querying
  type EventHydrated {
    id: ID!
    user: User!
    eventType: EventType!
    withRole: Role!
    route: String!
    createdAt: DateTime!
    eventData: JSONObject!
  }

  type Query {
    events: [EventHydrated!]!
    event(id: ID!): EventHydrated
    eventsByType(eventTypeId: ID!): [EventHydrated!]!
    eventsByUser(userId: ID!): [EventHydrated!]!
    eventsByRoute(route: String!): [EventHydrated!]!
  }
  
  type Mutation {
    createEvent(input: CreateEventInput!): EventHydrated!
  }

  """
  Some event inputs come from the client and others will
  need to be populated by the server for a full event record.
  """
  input CreateEventInput {
    userId: ID!
    eventTypeId: ID!
    route: String!
    eventData: JSONObject!
  }
`;

type DateTime = Date;
export interface Event {
  id: string;
  userId: string;
  eventTypeId: string;
  withRoleId: string;
  route: string;
  createdAt: DateTime;
  eventData: object;
}

export interface CreateEventInput {
  userId: string;
  eventTypeId: string;
  route: string;
  eventData: object;
}
