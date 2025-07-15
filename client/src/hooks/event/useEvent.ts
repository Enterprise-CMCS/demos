import { useLazyQuery, useMutation, FetchResult } from "@apollo/client";
import { useLocation } from "react-router-dom";
import { LOG_EVENT_MUTATION, GET_EVENTS_QUERY } from "queries/eventQueries";
import { EventHydrated, LogEventInput } from "demos-server";

export type LogEventArguments = Pick<LogEventInput, "eventTypeId" | "eventData">;

export interface EventOperations {
  logEvent: (input: LogEventArguments) => Promise<FetchResult<{ logEvent: EventHydrated }>>;
  getEvents: () => Promise<FetchResult<{ events: EventHydrated[] }>>;
}

export const useEvent = (): EventOperations => {
  const location = useLocation();

  const [logEventTrigger] = useMutation<{ logEvent: EventHydrated }>(LOG_EVENT_MUTATION);
  const [getEventsTrigger] = useLazyQuery<{ events: EventHydrated[] }>(GET_EVENTS_QUERY);

  return {
    logEvent: async (input: LogEventArguments) => {
      const logEventInput: LogEventInput = {
        ...input,
        route: location.pathname,
      };
      return await logEventTrigger({ variables: { input: logEventInput } });
    },
    getEvents: async () => await getEventsTrigger(),
  };
};
