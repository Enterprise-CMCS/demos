import { mapSchema, MapperKind, getDirectives, DirectiveAnnotation } from "@graphql-tools/utils";
import { defaultFieldResolver, GraphQLSchema, GraphQLResolveInfo, isListType } from "graphql";
import { GraphQLContext } from "../../auth/auth.util";
import { viewApplicationDirective } from "./systemRolePermission/viewApplication";
import { viewDemonstrationDirective } from "./systemRolePermission/viewDemonstration";
import { publicDirective } from "./systemRolePermission/public";

export type ResolverProps = {
  source: unknown;
  args: unknown;
  context: GraphQLContext;
  info: GraphQLResolveInfo;
};

type validator = (
  resolverContext: ResolverProps,
  directiveArgs: DirectiveAnnotation["args"]
) => Promise<boolean>;

interface DirectiveConfig {
  name?: string;
  checkAuthorization: validator;
}

interface PermissionDirective {
  name: string;
  args?: DirectiveAnnotation["args"];
}

const PERMISSION_DIRECTIVES: DirectiveConfig[] = [
  viewApplicationDirective,
  viewDemonstrationDirective,
  publicDirective,
];

// Check if ANY directive authorizes access
async function checkAuthorization(
  permissionDirectives: PermissionDirective[],
  resolverContext: ResolverProps
): Promise<boolean> {
  for (const directive of permissionDirectives) {
    const config = PERMISSION_DIRECTIVES.find((d) => d.name === directive.name);
    if (!config) continue;
    const isAuthorized = await config.checkAuthorization(resolverContext, directive.args);
    if (isAuthorized) {
      return true;
    }
  }
  return false;
}

export function authenticationDirectiveTransformer(schema: GraphQLSchema) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig, fieldName, typeName) => {
      const { resolve = defaultFieldResolver } = fieldConfig;
      fieldConfig.resolve = async function (source, args, context, info) {
        const typeConfig = schema.getType(typeName);
        if (!typeConfig) {
          throw new Error(`Type ${typeName} for field ${fieldName} not found in schema`);
        }

        const permissionDirectives = [
          ...getDirectives(schema, fieldConfig),
          ...getDirectives(schema, typeConfig),
        ].filter((directive) => PERMISSION_DIRECTIVES.some((d) => d.name === directive.name));

        const resolverContext: ResolverProps = { source, args, context, info };

        if (!isListType(fieldConfig.type)) {
          if (!(await checkAuthorization(permissionDirectives, resolverContext))) {
            throw new Error(
              `You do not have permission to access ${resolverContext.info.parentType.name}.${resolverContext.info.fieldName}`
            );
          }
        }

        const result = await resolve(source, args, context, info);
        if (Array.isArray(result)) {
          const filteredResults = [];
          for (const item of result) {
            const itemContext = { ...resolverContext, source: item };
            const isAuthorized = await checkAuthorization(permissionDirectives, itemContext);
            if (isAuthorized) {
              filteredResults.push(item);
            }
          }
          return filteredResults;
        }

        if (!(await checkAuthorization(permissionDirectives, resolverContext))) {
          throw new Error(
            `You do not have permission to access ${resolverContext.info.parentType.name}.${resolverContext.info.fieldName}`
          );
        }

        return result;
      };
      return fieldConfig;
    },
    [MapperKind.MUTATION_ROOT_FIELD]: (fieldConfig, fieldName, typeName) => {
      const { resolve = defaultFieldResolver } = fieldConfig;
      fieldConfig.resolve = async function (source, args, context, info) {
        const typeConfig = schema.getType(typeName);
        if (!typeConfig) {
          throw new Error(`Type ${typeName} for field ${fieldName} not found in schema`);
        }

        const permissionDirectives = [
          ...getDirectives(schema, fieldConfig),
          ...getDirectives(schema, typeConfig),
        ].filter((directive) => PERMISSION_DIRECTIVES.some((d) => d.name === directive.name));

        const resolverContext: ResolverProps = { source, args, context, info };

        if (!(await checkAuthorization(permissionDirectives, resolverContext))) {
          throw new Error(
            `You do not have permission to access ${resolverContext.info.parentType.name}.${resolverContext.info.fieldName}`
          );
        }
        return await resolve(source, args, context, info);
      };
      return fieldConfig;
    },
  });
}
