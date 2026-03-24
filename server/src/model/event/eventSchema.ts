import { gql } from "graphql-tag";
import { User, Application, Role, EventType, LogLevel } from "../../types.js";

export const eventSchema = gql`
  type Event {
    id: ID! @auth(requires: "Resolve Event")
    user: User @auth(requires: "Resolve Event")
    role: Role @auth(requires: "Resolve Event")
    application: Application @auth(requires: "Resolve Event")
    eventType: EventType! @auth(requires: "Resolve Event")
    logLevel: LogLevel! @auth(requires: "Resolve Event")
    route: String! @auth(requires: "Resolve Event")
    createdAt: DateTime! @auth(requires: "Resolve Event")
    eventData: JSONObject! @auth(requires: "Resolve Event")
  }

  type Query {
    events: [Event!]! @auth(requires: "Query Events")
    eventsByApplication(applicationId: String!): [Event!]! @auth(requires: "Query Events")
  }

  type Mutation {
    logEvent(input: LogEventInput!): Event! @auth(requires: "Log Events")
  }

  input LogEventInput {
    role: Role
    applicationId: String
    eventType: EventType!
    logLevel: LogLevel!
    route: String!
    eventData: JSONObject!
  }
`;

export interface Event {
  id: string;
  user?: User;
  role?: Role;
  application?: Application;
  eventType: EventType;
  logLevel: LogLevel;
  route: string;
  createdAt: Date;
  eventData: object;
}

export interface LogEventInput {
  role?: Role | null;
  applicationId?: string | null;
  eventType: EventType;
  logLevel: LogLevel;
  route: string;
  eventData: object;
}
