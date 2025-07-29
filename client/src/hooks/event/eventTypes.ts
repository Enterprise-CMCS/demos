export type LogLevel = "INFO" | "ERROR";

export type EventType =
  | "LOGIN_SUCCEEDED"
  | "LOGIN_FAILED"
  | "LOGOUT_SUCCEEDED"
  | "CREATE_EXTENSION"
  | "CREATE_EXTENSION_ERROR"; // optional, for failure logging

type EventLogLevelMap = {
  [K in EventType]: LogLevel;
};

const eventLogLevelMap: EventLogLevelMap = {
  LOGIN_SUCCEEDED: "INFO",
  LOGIN_FAILED: "ERROR",
  LOGOUT_SUCCEEDED: "INFO",
  CREATE_EXTENSION: "INFO",
  CREATE_EXTENSION_ERROR: "ERROR",
};

export const ALL_EVENT_TYPES: EventType[] = Object.keys(
  eventLogLevelMap
) as EventType[];

export const getLogLevelForEventType = (eventType: EventType): LogLevel => {
  return eventLogLevelMap[eventType];
};
