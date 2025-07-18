import { gql } from "graphql-tag";
import { User } from "../user/userSchema.js";
import { Role } from "../role/roleSchema.js";

export const eventSchema = gql`
  """
  Event represents a user action or system event.
  """
  type Event {
    id: ID!               # From B/E (generated by Prisma)
    user: User            # From B/E
    eventTypeId: String!  # From F/E
    role: Role            # From B/E
    logLevelId: String!   # From F/E
    route: String!        # From F/E
    createdAt: DateTime!  # From B/E (generated by Prisma)
    eventData: JSONObject # From F/E
  }

  type Query {
    events: [Event]!
    event(id: ID!): Event
    eventsByType(eventTypeId: String!): [Event]!
    eventsByRoute(route: String!): [Event]!
  }
  
  type Mutation {
    createEvent(input: CreateEventInput!): Event!
  }

  """
  Some event inputs come from the client and others will
  need to be populated by the server for a full event record.
  """
  input CreateEventInput {
    eventTypeId: String!
    logLevelId: String!
    route: String!
    eventData: JSONObject!
  }
`;

type DateTime = Date;
export interface Event {
  id: string;
  user?: User; // TODO: I think this isn't right but eslint doesn't handle User | null at the moment
  eventTypeId: string;
  role?: Role; // TODO: I think this isn't right but eslint doesn't handle User | null at the moment
  logLevelId: string;
  route: string;
  createdAt: DateTime;
  eventData?: object;
}

export interface CreateEventInput {
  eventTypeId: string;
  logLevelId: string;
  route: string;
  eventData: object;
}
