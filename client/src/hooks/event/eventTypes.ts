import { LogLevel, EventType } from "demos-server";

type EventLogLevelMap = {
  [K in EventType]: LogLevel;
};

const eventLogLevelMap: EventLogLevelMap = {
  "Login Succeeded": "info",
  "Login Failed": "err",
  "Logout Succeeded": "info",
  "Logout Failed": "err",
  "Create Demonstration Succeeded": "info",
  "Create Demonstration Failed": "err",
  "Create Extension Succeeded": "info",
  "Create Extension Failed": "err",
  "Create Amendment Succeeded": "info",
  "Create Amendment Failed": "err",
  "Edit Demonstration Succeeded": "info",
  "Edit Demonstration Failed": "err",
  "Delete Demonstration Succeeded": "info",
  "Delete Demonstration Failed": "err",
  "Delete Document Succeeded": "info",
  "Delete Document Failed": "err",
};

export const getLogLevelForEventType = (eventType: EventType): LogLevel => {
  return eventLogLevelMap[eventType];
};
