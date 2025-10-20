import jsEslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import { validateGraphQLTypescriptMatch } from './eslint-rules/validate-graphql-typescript-match.js';
import parser from '@typescript-eslint/parser';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = tseslint.config(
  {
    ignores: [
      '**/dev/*',
      '**/dist/*',
      '**/*.test.ts',
      '**/tsconfig.json',
      '**/build/*',
      '**/node_modules/*',
    ],
  },
  {
    files: ['src/**/*.ts'],
    ignores: ['**/*.test.ts'],
    languageOptions: {
      parser: parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
  },
  jsEslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {    
    files: ["src/model/**/*.ts"], // Scope to model folder only    
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
