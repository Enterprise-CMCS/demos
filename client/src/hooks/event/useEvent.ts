import {
  Event,
  EventLoggedStatus,
  LogEventInput,
} from "demos-server";
import {
  GET_EVENTS_QUERY,
  LOG_EVENT_MUTATION,
} from "queries/eventQueries";
import { useLocation } from "react-router-dom";

import {
  FetchResult,
  useLazyQuery,
  useMutation,
} from "@apollo/client";

import {
  EventType,
  getLogLevelForEventType,
} from "./eventTypes";

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
      const logEventInput: LogEventInput = {
        ...input,
        eventData: input.eventData ?? {},
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
