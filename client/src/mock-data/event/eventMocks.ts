import { EventHydrated } from "demos-server";
import { johnDoe } from "../userMocks";
import {
  LOG_EVENT_MUTATION,
  GET_EVENTS_QUERY,
} from "queries/eventQueries";
import { MockedResponse } from "@apollo/client/testing";
import { EventType } from "demos-server";
import { LogEventArguments } from "hooks/event/useEvent";

const testEventType: EventType = {
  id: "LOGIN_SUCCEEDED",
  logLevel: "INFO",
  description: "User login succeeded",
};

const createDemonstrationEventType: EventType = {
  id: "CREATE_DEMONSTRATION_SUCCEEDED",
  logLevel: "INFO",
  description: "Demonstration created successfully",
};

const testRole = {
  id: "CMS_USER",
  name: "CMS User",
  description: "CMS User Role",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  users: [],
  permissions: [],
};

const testEvent: EventHydrated = {
  id: "1",
  user: johnDoe,
  eventType: createDemonstrationEventType,
  withRole: testRole,
  route: "/events",
  createdAt: new Date("2025-01-01T10:00:00Z"),
  eventData: {
    additionalInfo: "User Created event from events page",
  },
};

const testEvent2: EventHydrated = {
  id: "2",
  user: johnDoe,
  eventType: createDemonstrationEventType,
  withRole: testRole,
  route: "/demonstrations",
  createdAt: new Date("2025-01-01T11:00:00Z"),
};

const mockLogEventInput: LogEventArguments = {
  eventTypeId: testEventType.id,
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
      variables: { input: {...mockLogEventInput, route: "/events"} },
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
