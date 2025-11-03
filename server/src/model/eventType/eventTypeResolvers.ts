import { generateCustomSetScalar } from "../../customScalarResolvers.js";
import { EVENT_TYPES } from "../../constants.js";

export const eventTypeResolvers = {
  EventType: generateCustomSetScalar(
    EVENT_TYPES,
    "EventType",
    "A string representing an event type."
  ),
};
