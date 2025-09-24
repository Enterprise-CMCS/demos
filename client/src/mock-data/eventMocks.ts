import { Event, Role } from "demos-server";
import { LogEventArguments } from "hooks/event/useEvent";
import { GET_EVENTS_QUERY, LOG_EVENT_MUTATION } from "queries/eventQueries";

import { MockedResponse } from "@apollo/client/testing";

import { MockUser, mockUsers } from "./userMocks";

export type MockEvent = Pick<
  Event,
  "id" | "eventType" | "logLevel" | "route" | "createdAt" | "eventData" | "withRole"
> & {
  user: MockUser;
};

const mockEvents = [
  {
    id: "1",
    user: mockUsers[0],
    eventType: "LOGIN_SUCCEEDED",
    logLevel: "INFO",
    withRole: "demos-cms-user" as Role,
    route: "/events",
    createdAt: new Date(2025, 0, 1),
    eventData: {
      additionalInfo: "User Created event from events page",
    },
  },
  {
    id: "2",
    user: mockUsers[0],
    eventType: "LOGIN_FAILED",
    logLevel: "ERROR",
    withRole: "demos-cms-user" as Role,
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
