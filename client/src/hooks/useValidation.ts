type ValidationMessage = string | undefined;
type ValidationRule<TFormData> = (formData: TFormData) => ValidationMessage;
export type ValidationRuleConfig<TFormData> = {
  check: (formData: TFormData) => boolean;
  message: string;
};
export type ValidationConfig<TFormData> = {
  [TField in keyof TFormData]?: ValidationRuleConfig<TFormData>[];
};
export type ValidationSchema<TFormData> = {
  [TField in keyof TFormData]?: ValidationRule<TFormData>[];
};
type ValidationErrors<TFormData> = {
  [TField in keyof TFormData]?: ValidationMessage;
};

export const buildValidationSchema = <TFormData extends object>(
  config: ValidationConfig<TFormData>
): ValidationSchema<TFormData> => {
  const schema: ValidationSchema<TFormData> = {};

  for (const field of Object.keys(config) as (keyof TFormData)[]) {
    const rules = config[field] ?? [];
    schema[field] = rules.map(
      (rule) => (formData) => (rule.check(formData) ? undefined : rule.message)
    );
  }

  return schema;
};

export const useValidation = <TFormData extends object>(
  formData: TFormData,
  schema: ValidationSchema<TFormData>
) => {
  const errors: ValidationErrors<TFormData> = {};

  for (const field of Object.keys(schema) as (keyof TFormData)[]) {
    const rules = schema[field] ?? [];

    for (const rule of rules) {
      const message = rule(formData);
      if (message) {
        errors[field] = message;
        break;
      }
    }
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    errors,
    isValid,
  };
};
