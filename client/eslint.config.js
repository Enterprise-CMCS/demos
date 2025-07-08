import prettierConfig from "eslint-config-prettier/flat";
import reactEslint from "eslint-plugin-react";
import tseslint from "typescript-eslint";

import jsEslint from "@eslint/js";

import {
  noRelativeComponentImports,
} from "./eslint-rules/no-relative-component-imports.js";

const eslintConfig = tseslint.config(
  jsEslint.configs.recommended,
  tseslint.configs.recommended,
  reactEslint.configs.flat.recommended,
  prettierConfig,
  {
    settings: {
      react: {
        version: "detect",
      },
    },
    plugins: {
      "no-relative-component-imports": {
        rules: { "no-relative-component-imports": noRelativeComponentImports },
      },
    },
    rules: {
      indent: ["error", 2, { SwitchCase: 1 }],
      quotes: ["error", "double"],
      semi: ["error", "always"],
      "no-trailing-spaces": "error",
      "no-tabs": "error",
      "eol-last": ["error", "always"],
      "comma-dangle": [
        "error",
        {
          arrays: "always-multiline",
          objects: "always-multiline",
          imports: "always-multiline",
          exports: "always-multiline",
        },
      ],
      "no-restricted-exports": [
        "error",
        { restrictDefaultExports: { direct: true } },
      ],
      "no-relative-component-imports/no-relative-component-imports": "error",
    },
    overrides: [
      {
        files: ["*.ts", "*.tsx"],
        rules: {
          "react/prop-types": "off", // Disable prop-types for TypeScript files
        },
      },
    ],
  }
);

// eslint-disable-next-line no-restricted-exports
export default eslintConfig;
