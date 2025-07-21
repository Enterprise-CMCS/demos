import { useLazyQuery, useMutation, FetchResult } from "@apollo/client";
import { useLocation } from "react-router-dom";
import { LOG_EVENT_MUTATION, GET_EVENTS_QUERY } from "queries/eventQueries";
import { Event, EventLoggedStatus, LogEventInput } from "demos-server";
import { getLogLevelForEventType, EventType } from "./eventTypes";

export type LogEventArguments = {
  eventType: EventType;
  eventData?: LogEventInput["eventData"];
};

export interface EventOperations {
  logEvent: (input: LogEventArguments) => Promise<FetchResult<{ logEvent: EventLoggedStatus }>>;
  getEvents: () => Promise<FetchResult<{ events: Event[] }>>;
}

export const useEvent = (): EventOperations => {
  const location = useLocation();

  const [logEventTrigger] = useMutation<{ logEvent: EventLoggedStatus }>(LOG_EVENT_MUTATION);
  const [getEventsTrigger] = useLazyQuery<{ events: Event[] }>(GET_EVENTS_QUERY);

  return {
    logEvent: async (input: LogEventArguments) => {
      const logEventInput: LogEventInput = {
        ...input,
        route: location.pathname,
        logLevel: getLogLevelForEventType(input.eventType),
      };
      return await logEventTrigger({ variables: { input: logEventInput } });
    },
    getEvents: async () => await getEventsTrigger(),
  };
};
