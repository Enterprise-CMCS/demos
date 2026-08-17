export type ValidationRuleConfig<TData> = {
  check: (data: TData) => boolean;
  message: string;
};

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
  errors: ValidationErrors<TConfig>;
  isValid: boolean;
};

export const useValidation = <TData extends object, TConfig extends ValidationConfig<TData>>(
  data: TData,
  config: TConfig
): ValidationResult<TConfig> => {
  const errors = {} as ValidationErrors<TConfig>;

  for (const ruleName of Object.keys(config) as (keyof TConfig)[]) {
    const rule = config[ruleName];
    if (!rule) continue;

    const message = rule.check(data) ? undefined : rule.message;
    errors[ruleName] = message;
  }

  const isValid = Object.values(errors).every((msg) => msg === undefined);

  return {
    errors,
    isValid,
  };
};
