import { EventHydrated, LogEventInput } from "demos-server";
import { johnDoe } from "../userMocks";
import {
  LOG_EVENT_MUTATION,
  GET_EVENTS_QUERY,
} from "queries/eventQueries";
import { MockedResponse } from "@apollo/client/testing";
import { EventType } from "demos-server";

export const testEventType: EventType = {
  id: "PAGE_VIEW",
  description: "User page view event",
};

export const testRole = {
  id: "CMS_USER",
  name: "CMS User",
  description: "CMS User Role",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  users: [],
  permissions: [],
};

export const testEvent: EventHydrated = {
  id: "1",
  user: johnDoe,
  eventType: testEventType,
  withRole: testRole,
  route: "/demonstrations",
  createdAt: new Date("2025-01-01T10:00:00Z"),
  eventData: {
    demonstrationId: "demo-123",
    additionalInfo: "User viewed demonstrations page",
  },
};

export const testEvent2: EventHydrated = {
  id: "2",
  user: johnDoe,
  eventType: testEventType,
  withRole: testRole,
  route: "/demonstrations/new",
  createdAt: new Date("2025-01-01T11:00:00Z"),
  eventData: {
    buttonId: "add-demonstration",
    action: "create",
  },
};

export const mockLogEventInput: LogEventInput = {
  eventTypeId: testEventType.id,
  route: "/demonstrations",
  eventData: {
    demonstrationId: "demo-123",
    additionalInfo: "Test event log",
  },
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
      variables: { input: mockLogEventInput },
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
