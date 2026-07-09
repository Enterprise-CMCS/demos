import React from "react";

type ValidationMessage = string | undefined;

type ValidationRule<TValues> = (values: TValues) => ValidationMessage;

export type ValidationSchema<TValues> = {
  [TField in keyof TValues]?: ValidationRule<TValues>[];
};

type ValidationErrors<TValues> = {
  [TField in keyof TValues]?: ValidationMessage;
};

export const useValidation = <TValues extends object>(
  values: TValues,
  schema: ValidationSchema<TValues>
) => {
  const getValidationMessage = React.useCallback(
    <TField extends keyof TValues>(field: TField): ValidationMessage => {
      const rules = schema[field] ?? [];

      for (const rule of rules) {
        const message = rule(values);
        if (message) {
          return message;
        }
      }

      return undefined;
    },
    [schema, values]
  );

  const errors = React.useMemo(() => {
    const nextErrors: ValidationErrors<TValues> = {};

    for (const field of Object.keys(schema) as (keyof TValues)[]) {
      const message = getValidationMessage(field);
      if (message) {
        nextErrors[field] = message;
      }
    }

    return nextErrors;
  }, [schema, getValidationMessage]);

  const isValid = React.useMemo(() => Object.keys(errors).length === 0, [errors]);

  return {
    errors,
    isValid,
    getValidationMessage,
  };
};
