import {
  useLazyQuery,
  useMutation,
  ApolloError,
  FetchResult,
} from "@apollo/client";
import {
  LOG_EVENT_MUTATION,
  GET_EVENTS_QUERY,
} from "queries/eventQueries";
import { EventHydrated, LogEventInput } from "demos-server";

interface LogEventOperation {
  trigger: (input: LogEventInput) => Promise<FetchResult<{ logEvent: EventHydrated }>>;
  data?: EventHydrated;
  loading: boolean;
  error?: ApolloError;
}

interface GetEventsOperation {
  trigger: () => void;
  data?: EventHydrated[];
  loading: boolean;
  error?: ApolloError;
}

export interface EventOperations {
  logEvent: LogEventOperation;
  getEvents: GetEventsOperation;
}

const createLogEventHook = (): LogEventOperation => {
  const [trigger, { data, loading, error }] = useMutation<{
    logEvent: EventHydrated;
  }>(LOG_EVENT_MUTATION);

  return {
    trigger: async (input: LogEventInput) =>
      await trigger({
        variables: { input },
      }),
    data: data?.logEvent,
    loading,
    error,
  };
};

const createGetEventsHook = (): GetEventsOperation => {
  const [trigger, { data, loading, error }] = useLazyQuery<{
    events: EventHydrated[];
  }>(GET_EVENTS_QUERY);

  return {
    trigger: () => trigger(),
    data: data?.events,
    loading,
    error,
  };
};

export const useEvent = (): EventOperations => {
  const logEventOperation = createLogEventHook();
  const getEventsOperation = createGetEventsHook();

  return {
    logEvent: logEventOperation,
    getEvents: getEventsOperation,
  };
};
