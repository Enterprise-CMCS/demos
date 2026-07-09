type ValidationMessage = string | undefined;
type ValidationRule<TFormData> = (formData: TFormData) => ValidationMessage;
export type ValidationSchema<TFormData> = {
  [TField in keyof TFormData]?: ValidationRule<TFormData>[];
};
type ValidationErrors<TFormData> = {
  [TField in keyof TFormData]?: ValidationMessage;
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
