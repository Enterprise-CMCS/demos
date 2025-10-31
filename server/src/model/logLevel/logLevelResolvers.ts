import { generateCustomSetScalar } from "../../customScalarResolvers.js";
import { LOG_LEVELS } from "../../constants.js";

export const logLevelResolvers = {
  LogLevel: generateCustomSetScalar(LOG_LEVELS, "LogLevel", "A string representing a log level."),
};
