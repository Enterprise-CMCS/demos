// Utility to log GraphQL Armor rejections
import { ValidationContext } from "graphql/validation/ValidationContext";
import { log } from "../log";
import { GraphQLError } from "graphql/error";

// See https://escape.tech/graphql-armor/docs/category/plugins/ for more details on configuration options for each plugin
export const GraphQLArmorConfig = {
  costLimit: {
    onReject: [logRejection],
  },
  maxAliases: {
    onReject: [logRejection],
  },
  maxDepth: {
    onReject: [logRejection],
  },
  maxDirectives: {
    onReject: [logRejection],
  },
  maxTokens: {
    onReject: [logRejection],
  },
};

export function logRejection(
  ctx: ValidationContext | null,
  error: GraphQLError,
) {
  log.warn({
    type: "graphql.armor.rejection",
    error,
    ctx,
  });
}
