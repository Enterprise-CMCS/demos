export type ValidationConfig<TData> = {
  [ruleName: string]: {
    check: (data: TData) => boolean;
    message: string;
  };
};

type ValidationErrors<TConfig> = {
  [K in keyof TConfig]: string | undefined;
};

type ValidationResult<TConfig> = {
  validationErrors: ValidationErrors<TConfig>;
  isValid: boolean;
};

export const useValidation = <TData extends object, TConfig extends ValidationConfig<TData>>(
  data: TData,
  config: TConfig
): ValidationResult<TConfig> => {
  const validationErrors = {} as ValidationErrors<TConfig>;

  for (const ruleName of Object.keys(config) as (keyof TConfig)[]) {
    const rule = config[ruleName];
    if (!rule) continue;

    const message = rule.check(data) ? undefined : rule.message;
    validationErrors[ruleName] = message;
  }

  const isValid = Object.values(validationErrors).every((msg) => msg === undefined);

  return {
    validationErrors,
    isValid,
  };
};
