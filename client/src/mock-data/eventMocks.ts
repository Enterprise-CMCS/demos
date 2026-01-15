import { Event } from "demos-server";
import { LogEventArguments } from "hooks/event/useEvent";
import { MockedResponse } from "@apollo/client/testing";
import { MockUser, mockUsers } from "./userMocks.js";
import { MockDemonstration, MOCK_DEMONSTRATION } from "./demonstrationMocks.js";
import { LOG_EVENT_MUTATION, GET_EVENTS_QUERY } from "hooks/event/useEvent";

export type MockEvent = Pick<
  Event,
  "id" | "eventType" | "logLevel" | "route" | "createdAt" | "eventData" | "role"
> & {
  user: MockUser;
  application: MockDemonstration;
};

const mockEvents = [
  {
    id: "1",
    user: mockUsers[0],
    eventType: "Login Succeeded",
    logLevel: "info",
    role: "All Users",
    route: "/events",
    createdAt: new Date(2025, 0, 1),
    eventData: {
      additionalInfo: "User Created event from events page",
    },
    application: MOCK_DEMONSTRATION,
  },
  {
    id: "2",
    user: mockUsers[0],
    eventType: "Login Failed",
    logLevel: "err",
    role: "All Users",
    route: "/demonstrations",
    createdAt: new Date(2025, 0, 1),
    eventData: {},
    application: MOCK_DEMONSTRATION,
  },
] as const satisfies MockEvent[];

const mockLogEventInput: LogEventArguments = {
  eventType: "Login Succeeded",
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
