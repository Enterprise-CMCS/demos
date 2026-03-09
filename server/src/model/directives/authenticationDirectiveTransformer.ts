import {
  mapSchema,
  MapperKind,
  getDirectives,
  DirectiveAnnotation,
  FieldMapper,
} from "@graphql-tools/utils";
import { defaultFieldResolver, GraphQLSchema, GraphQLResolveInfo, GraphQLNamedType } from "graphql";
import { GraphQLContext } from "../../auth/auth.util";
import { authDirective } from "./authDirective";

const PERMISSION_DIRECTIVES: DirectiveConfiguration[] = [authDirective];

export type ResolverProps = {
  source: unknown;
  args: unknown;
  context: GraphQLContext;
  info: GraphQLResolveInfo;
};

export type AuthorizationCheckFunction = (
  resolverProps: ResolverProps,
  directive: DirectiveAnnotation
) => Promise<boolean>;

export type AuthorizationClosure = (resolverProps: ResolverProps) => Promise<boolean>;

export type DirectiveConfiguration = {
  name: string;
  checkAuthorization: AuthorizationCheckFunction;
};

async function checkAuthorization(
  directiveFunctions: AuthorizationClosure[],
  resolverProps: ResolverProps
): Promise<boolean> {
  for (const directive of directiveFunctions) {
    const isAuthorized = await directive(resolverProps);
    if (isAuthorized) {
      return true;
    }
  }
  return false;
}

const getDirectiveFunctions = (
  schema: GraphQLSchema,
  fieldConfig: Parameters<FieldMapper>[0],
  typeConfig: GraphQLNamedType
): AuthorizationClosure[] => {
  return [...getDirectives(schema, fieldConfig), ...getDirectives(schema, typeConfig)]
    .map((fieldDirective) => {
      const permissionDirective = PERMISSION_DIRECTIVES.find((d) => d.name === fieldDirective.name);
      if (permissionDirective) {
        return (resolverProps: ResolverProps) =>
          permissionDirective.checkAuthorization(resolverProps, fieldDirective);
      }
    })
    .filter((directiveFunction) => directiveFunction !== undefined);
};

export function authenticationDirectiveTransformer(schema: GraphQLSchema) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig, fieldName, typeName) => {
      const { resolve = defaultFieldResolver } = fieldConfig;
      fieldConfig.resolve = async function (source, args, context, info) {
        const typeConfig = schema.getType(typeName);
        if (!typeConfig) {
          throw new Error(`Type ${typeName} for field ${fieldName} not found in schema`);
        }

        const directiveFunctions = getDirectiveFunctions(schema, fieldConfig, typeConfig);

        if (!(await checkAuthorization(directiveFunctions, { source, args, context, info }))) {
          throw new Error(
            `You do not have permission to access ${info.parentType.name}.${info.fieldName}`
          );
        }
        return await resolve(source, args, context, info);
      };
      return fieldConfig;
    },
  });
}
