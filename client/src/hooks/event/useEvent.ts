import { useLazyQuery, useMutation, FetchResult } from "@apollo/client";
import { useLocation } from "react-router-dom";
import { LOG_EVENT_MUTATION, GET_EVENTS_QUERY } from "queries/eventQueries";
import { Event, EventType, LogEventInput } from "demos-server";
import { getLogLevelForEventType } from "./eventTypes.js";
import { version } from "../../../package.json";

export type LogEventArguments = {
  eventType: EventType;
  eventData?: LogEventInput["eventData"];
};

export interface EventOperations {
  logEvent: (input: LogEventArguments) => Promise<FetchResult<{ logEvent: Event }>>;
  getEvents: () => Promise<FetchResult<{ events: Event[] }>>;
}

function getStackTrace(): string {
  const rawStack = new Error().stack || "";
  return rawStack
    .split("\n")
    .filter((line, idx) => idx !== 0) // Remove the "Error" line
    .join("\n");
}

export const useEvent = (): EventOperations => {
  const location = useLocation();

  const [logEventTrigger] = useMutation<{ logEvent: Event }>(LOG_EVENT_MUTATION);
  const [getEventsTrigger] = useLazyQuery<{ events: Event[] }>(GET_EVENTS_QUERY);

  return {
    logEvent: async (input: LogEventArguments) => {
      const stackTrace = getStackTrace();
      const eventData = {
        ...(input.eventData ?? {}),
        appVersion: version,
        stackTrace,
      };
      const logEventInput: LogEventInput = {
        ...input,
        eventData,
        route: location.pathname,
        logLevel: getLogLevelForEventType(input.eventType),
      };
      return await logEventTrigger({
        variables: { input: logEventInput },
      });
    },
    getEvents: async () => await getEventsTrigger(),
  };
};
