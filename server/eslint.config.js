import jsEslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import {validateGraphQLTypescriptMatch} from './eslint-rules/validate-graphql-typescript-match.js';

const eslintConfig = tseslint.config(
  jsEslint.configs.recommended,
  tseslint.configs.recommended,
  {
    plugins: {
      "validate-graphql-typescript-match": {
        rules: { "validate-graphql-typescript-match": validateGraphQLTypescriptMatch },
      },
    },
    rules: {
      "eol-last": ["error", "always"], // Newline at the end of files
      "no-restricted-exports": ["error", { "restrictDefaultExports": { "direct": true } }], // Disallow default exports
      "validate-graphql-typescript-match/validate-graphql-typescript-match": "error",
    }
  },
);

// eslint-disable-next-line no-restricted-exports
export default eslintConfig;
