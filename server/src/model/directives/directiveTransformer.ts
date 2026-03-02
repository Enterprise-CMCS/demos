import { mapSchema, MapperKind, getDirectives, DirectiveAnnotation } from "@graphql-tools/utils";
import { defaultFieldResolver, GraphQLSchema } from "graphql";
import { cmsOnlyDirective } from "./cmsOnlyDirective";
import { belongsToDemonstrationDirective } from "./belongsToDemonstrationDirective";

type validator = (
  source,
  args,
  context,
  info,
  directiveArgs: DirectiveAnnotation["args"]
) => boolean;

interface DirectiveConfig {
  validate: validator;
}

const DIRECTIVE_MAP: Record<string, DirectiveConfig> = {
  [cmsOnlyDirective.name]: cmsOnlyDirective,
  [belongsToDemonstrationDirective.name]: belongsToDemonstrationDirective,
};

export function directiveTransformer(schema: GraphQLSchema) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig, _fieldName, typeName) => {
      const { resolve = defaultFieldResolver } = fieldConfig;
      fieldConfig.resolve = async function (source, args, context, info) {
        const typeConfig = schema.getType(typeName);
        if (!typeConfig) {
          throw new Error(`Type ${typeName} not found in schema`);
        }

        const result = await resolve(source, args, context, info);

        const permissionDirectives = [
          ...getDirectives(schema, fieldConfig),
          ...getDirectives(schema, typeConfig),
        ].filter((directive) => directive.name in DIRECTIVE_MAP);

        if (Array.isArray(result)) {
          return result.filter((item) => {
            for (const directive of permissionDirectives) {
              const config = DIRECTIVE_MAP[directive.name];
              const isAuthorized = config.validate(item, args, context, info, directive.args);
              if (isAuthorized) {
                return true;
              }
            }
            return false;
          });
        }

        for (const directive of permissionDirectives) {
          const config = DIRECTIVE_MAP[directive.name];
          const isAuthorized = config.validate(source, args, context, info, directive.args);

          if (isAuthorized) {
            return result;
          }
        }

        throw new Error(
          `You do not have permission to access ${info.parentType.name}.${info.fieldName}`
        );
      };
      return fieldConfig;
    },
  });
}
