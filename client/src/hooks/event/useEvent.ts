import { useLazyQuery, useMutation, FetchResult } from "@apollo/client";
import { useLocation } from "react-router-dom";
import { LOG_EVENT_MUTATION, GET_EVENTS_QUERY } from "queries/eventQueries";
import { Event, EventLoggedStatus, LogEventInput } from "demos-server";
import { getLogLevelForEventType, EventType } from "./eventTypes";
import { version } from "../../../package.json";

export type LogEventArguments = {
  eventType: EventType;
  eventData?: LogEventInput["eventData"];
};

export interface EventOperations {
  logEvent: (
    input: LogEventArguments
  ) => Promise<FetchResult<{ logEvent: EventLoggedStatus }>>;
  getEvents: () => Promise<FetchResult<{ events: Event[] }>>;
}

export const useEvent = (): EventOperations => {
  const location = useLocation();

  const [logEventTrigger] = useMutation<{ logEvent: EventLoggedStatus }>(
    LOG_EVENT_MUTATION
  );
  const [getEventsTrigger] = useLazyQuery<{ events: Event[] }>(
    GET_EVENTS_QUERY
  );

  return {
    logEvent: async (input: LogEventArguments) => {
      const rawStack = new Error().stack || "";
      const stackTrace = rawStack
        .split("\n")
        .filter((line, idx) => idx !== 0) // Remove the "Error" line
        .join("\n");
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
