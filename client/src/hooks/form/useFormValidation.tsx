
import { useCallback, useState } from "react";

type Validator<T> = {
  [K in keyof T]?: (value: T[K], values: T) => string | undefined;
};

type ValidationErrors<T> = Partial<Record<keyof T, string>>;

export const useFormValidation = <T extends object>(
  values: T,
  validators: Validator<T>
) => {
  const [touchedFields, setTouchedFields] = useState<
    Partial<Record<keyof T, boolean>>
  >({});

  const errors = Object.keys(validators).reduce<ValidationErrors<T>>(
    (result, key) => {
      const field = key as keyof T;
      const error = validators[field]?.(values[field], values);

      if (error) result[field] = error;

      return result;
    },
    {}
  );

  const markTouched = useCallback((field: keyof T) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  }, []);

  const getError = useCallback(
    (field: keyof T) =>
      touchedFields[field] ? errors[field] : undefined,
    [touchedFields, errors]
  );

  const validateAll = useCallback(() => {
    setTouchedFields(
      Object.keys(validators).reduce<Partial<Record<keyof T, boolean>>>(
        (result, key) => {
          result[key as keyof T] = true;
          return result;
        },
        {}
      )
    );

    return Object.keys(errors).length === 0;
  }, [validators, errors]);

  return {
    errors,
    getError,
    markTouched,
    validateAll,
    isValid: Object.keys(errors).length === 0,
  };
};
