import jsEslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["cdk.out/**/*"],
  },
  jsEslint.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      "eol-last": ["error", "always"],
      quotes: [
        "error",
        "double",
        { avoidEscape: true, allowTemplateLiterals: true },
      ],
    },
  }
);
