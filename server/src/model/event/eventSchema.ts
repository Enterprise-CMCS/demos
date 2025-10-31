import { gql } from "graphql-tag";
import { User, Application, Role, EventType, LogLevel } from "../../types.js";

export const eventSchema = gql`
  type Event {
    id: ID!
    user: User
    role: Role
    application: Application
    eventType: EventType!
    logLevel: LogLevel!
    route: String!
    createdAt: DateTime!
    eventData: JSONObject!
  }

  type Query {
    events: [Event!]!
    eventsByApplication(applicationId: String!): [Event!]!
  }

  type Mutation {
    logEvent(input: LogEventInput!): Event!
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
