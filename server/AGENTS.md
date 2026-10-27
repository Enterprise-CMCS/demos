# DEMOS Server Agent Guidelines

These instructions apply to the DEMOS server. Also follow the repository-level `AGENTS.md` and consult `server/README.md` for the full data-model and GraphQL conventions.

## Architecture

- The server is a TypeScript Apollo GraphQL API backed by Prisma and PostgreSQL.
- `src/local-server.ts` is the local-development entry point; `src/server.ts` is the AWS Lambda entry point.
- `src/model/` owns Prisma models, GraphQL schemas, resolvers, and migrations.
- `src/sql/` contains database objects refreshed on deployment. SQL in this directory must be idempotent.
- `src/prismaClient.ts` owns Prisma client creation; use the shared client rather than constructing another one.
- `src/types.ts` exports server and shared consumer types. Reuse these types instead of duplicating them in downstream packages.

## Models and Database Changes

- Keep each model's Prisma definition, GraphQL schema, resolvers, tests, and seed data synchronized.
- Register new model schemas and resolvers in `src/model/graphql.ts`.
- Use `PascalCase` for Prisma models and GraphQL types, `camelCase` for TypeScript fields and model directories, and `snake_case` for database tables and columns.
- Map multiword Prisma fields and every model to their database names with `@map` and `@@map` as appropriate.
- Prefer static constraint tables over database enums unless there is a documented reason to use an enum.
- Enforce durable business and data-integrity constraints in the database when practical, while also exposing useful constraints through server types or constants.
- Keep Prisma model files ordered as: optional flags, scalar fields, relation fields, then table constraints.
- Use the established model flags (`NO_HISTORY`, `NO_CREATED_TS`, `NO_UPDATED_TS`, `STATIC_CONSTRAINT`, and `TYPE_LIMITER`) consistently and include explanations where required.
- When changing a history-enabled table, update its history model and the related definitions in `src/sql/history_triggers.sql`.
- Generate migrations with Prisma, but inspect and, when necessary, correct the generated SQL. Consider existing data, nullability, foreign-key actions, indexes, and rollback/deployment safety.
- Never edit an already-deployed migration merely to change current schema behavior; add a new migration unless the task explicitly concerns an unmerged migration.

## GraphQL and Resolvers

- Keep GraphQL definitions and their TypeScript interfaces aligned; the custom ESLint rule validates model schemas.
- Use `ID` for synthetic identifiers such as UUIDs and `String` for human-readable identifiers.
- Prefer singular and plural query names without a `get` prefix, such as `application` and `applications`.
- Use `createX`, `updateX`, and `deleteXs` for independent entities; use descriptive `setX` and `unsetX` mutations for associations and upserts.
- Prefer resolver chaining and field resolvers over adding narrowly filtered top-level queries.
- Preserve authorization checks when extracting or reusing resolver logic. Treat changes to auth filters, claims, permissions, and field authorization as security-sensitive.
- Alias Prisma-generated types with a `Prisma` prefix when they could be confused with GraphQL/domain types.
- Preserve the special `PrismaApplication` union behavior documented in `server/README.md`; do not replace it with the two-column Prisma `Application` model accidentally.

## Error Handling and Logging

- Fail fast on invalid inputs and return established domain or GraphQL errors rather than leaking internal exceptions.
- Do not swallow Prisma errors. Preserve the existing special handling for false-positive `P2025` errors caused by no-op update triggers.
- Use the shared logger and avoid logging access tokens, claims containing sensitive data, secrets, uploaded content, or unnecessary personal information.
- Keep AWS and external-service access behind the existing adapters so local implementations and tests remain usable.

## Testing and Validation

- Place tests next to the implementation as `*.test.ts` and use Vitest.
- Prefer behavior-focused tests with deterministic fixtures. Cover authorization, validation, database constraints, and failure paths relevant to the change.
- Use the existing Prisma and service mocks rather than creating incompatible parallel test infrastructure.
- From `server/`, common checks are:
  - `npm test -- <path-or-pattern>` for focused tests.
  - `npm test` for the full unit suite.
  - `npm run lint` for lint and GraphQL/TypeScript schema consistency.
  - `npm run build:ci` for Prisma generation, TypeScript compilation, and bundling.
  - `npm run prisma:format` after Prisma model changes.
- Database reset, seeding, and migration commands can destroy local data. Confirm the target is a disposable local database before running them.

