import { Event } from "demos-server";
import { LogEventArguments } from "hooks/event/useEvent";
import { GET_EVENTS_QUERY, LOG_EVENT_MUTATION } from "queries/eventQueries";

import { MockedResponse } from "@apollo/client/testing";

import { johnDoe, MockUser } from "./userMocks";
import { MockRole, mockRoles } from "./roleMocks";

export type MockEvent = Pick<
  Event,
  "id" | "eventType" | "logLevel" | "route" | "createdAt" | "eventData"
> & {
  user: MockUser;
  withRole: MockRole;
};

const mockEvents = [
  {
    id: "1",
    user: johnDoe,
    eventType: "LOGIN_SUCCEEDED",
    logLevel: "INFO",
    withRole: mockRoles[0],
    route: "/events",
    createdAt: new Date(2025, 0, 1),
    eventData: {
      additionalInfo: "User Created event from events page",
    },
  },
  {
    id: "2",
    user: johnDoe,
    eventType: "LOGIN_FAILED",
    logLevel: "ERROR",
    withRole: mockRoles[0],
    route: "/demonstrations",
    createdAt: new Date(2025, 0, 1),
    eventData: {},
  },
] as const satisfies MockEvent[];

const mockLogEventInput: LogEventArguments = {
  eventType: "LOGIN_SUCCEEDED",
};

export const eventMocks: MockedResponse[] = [
  {
    request: {
      query: GET_EVENTS_QUERY,
    },
    result: {
      data: { events: [mockEvents[0], mockEvents[1]] },
    },
  },
  {
    request: {
      query: LOG_EVENT_MUTATION,
      variables: { input: { ...mockLogEventInput, route: "/events" } },
    },
    result: {
      data: { logEvent: mockEvents[0] },
    },
  },
  {
    request: {
      query: LOG_EVENT_MUTATION,
      variables: { input: { eventTypeId: "INVALID_EVENT" } },
    },
    error: new Error("Failed to log event"),
  },
];
