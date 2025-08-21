import { Event } from "demos-server";
import { LogEventArguments } from "hooks/event/useEvent";
import { GET_EVENTS_QUERY, LOG_EVENT_MUTATION } from "queries/eventQueries";

import { MockedResponse } from "@apollo/client/testing";

import { johnDoe } from "../userMocks";

const testRole = {
  id: "CMS_USER",
  name: "CMS User",
  description: "CMS User Role",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  users: [],
  permissions: [],
};

const testEvent: Event = {
  id: "1",
  user: johnDoe,
  eventType: "LOGIN_SUCCEEDED",
  logLevel: "INFO",
  withRole: testRole,
  route: "/events",
  createdAt: new Date("2025-01-01T10:00:00Z"),
  eventData: {
    additionalInfo: "User Created event from events page",
  },
};

const testEvent2: Event = {
  id: "2",
  user: johnDoe,
  eventType: "LOGIN_FAILED",
  logLevel: "ERROR",
  withRole: testRole,
  route: "/demonstrations",
  createdAt: new Date("2025-01-01T11:00:00Z"),
  eventData: {
    additionalInfo: "Failed login attempt",
  },
};

const mockLogEventInput: LogEventArguments = {
  eventType: "LOGIN_SUCCEEDED",
};

export const eventMocks: MockedResponse[] = [
  {
    request: {
      query: GET_EVENTS_QUERY,
    },
    result: {
      data: { events: [testEvent, testEvent2] },
    },
  },

  {
    request: {
      query: LOG_EVENT_MUTATION,
      variables: { input: { ...mockLogEventInput, route: "/events" } },
    },
    result: {
      data: { logEvent: testEvent },
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
