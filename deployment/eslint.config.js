import jsEslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["cdk.out/**/*", "config.template.js"],
  },
  jsEslint.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      indent: ["error", 2, { SwitchCase: 1 }],
      "eol-last": ["error", "always"],
      quotes: ["error", "double", { avoidEscape: true, allowTemplateLiterals: true }],
      "object-curly-spacing": ["error", "always"],
      "comma-spacing": ["error", { before: false, after: true }],
      "key-spacing": ["error", { beforeColon: false, afterColon: true }],
      "keyword-spacing": "error",
      "space-infix-ops": "error",
      "space-before-blocks": "error",
      "arrow-spacing": "error",
      "func-call-spacing": ["error", "never"],
      semi: ["error", "always"],
      "no-trailing-spaces": "error",
      "no-tabs": "error",
      "brace-style": ["error", "1tbs", { allowSingleLine: true }],
      "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0 }],
      eqeqeq: ["error", "always", { null: "ignore" }],
      curly: ["error", "multi-line", "consistent"],
      "object-shorthand": ["error", "always"],
      "comma-dangle": [
        "error",
        {
          arrays: "always-multiline",
          objects: "always-multiline",
          imports: "always-multiline",
          exports: "always-multiline",
          functions: "always-multiline",
        },
      ],
    },
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
      },
    },
  },
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-unnecessary-condition": "warn",
    },
  },
);
