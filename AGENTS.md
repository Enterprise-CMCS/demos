# DEMOS Agent Guidelines

This file provides repository-wide instructions for AI agents working on the Demonstration Evaluation & Management Oversight System (DEMOS). More specific `AGENTS.md` files apply within their directories and take precedence over this file when guidance differs.

## Working Principles

- Make the smallest change that completely addresses the request.
- Follow established patterns in the affected package before introducing a new abstraction, dependency, or convention.
- Preserve public interfaces and existing behavior unless the task explicitly requires a change.
- Treat authentication, authorization, sensitive data, database migrations, and infrastructure changes as high risk. Call out assumptions and validate them explicitly.
- Do not edit generated output, vendored dependencies, build artifacts, coverage output, or lockfiles unless the requested change requires it. Examples include `node_modules/`, `dist/`, `build/`, `coverage/`, `cdk.out/`, and generated Prisma clients.
- Never add credentials, tokens, private keys, production data, or environment-specific secrets to the repository.

## Repository Structure

- `client/`: React, TypeScript, Apollo Client, and Vitest user interface.
- `server/`: Apollo GraphQL API, Prisma models and migrations, PostgreSQL SQL, and AWS Lambda entry points.
- `shared_library/`: code and types shared by the client, server, and supporting packages.
- `deployment/`: AWS CDK stacks, deployment utilities, and `demosctl`.
- `data/`: data tooling and database-related assets.
- `data-migration/`: migration tooling with its own instructions and task-specific skills.
- `lambdas/`: standalone Lambda functions and their supporting code.
- `pipelines/`: CI/CD pipeline definitions and resources.

## TypeScript

- Use `camelCase` for functions and variables, `PascalCase` for classes, components, interfaces, and types, and `UPPER_SNAKE_CASE` for module-level constants.
- Prefer `const`, descriptive names, explicit domain types, and guard clauses for invalid input.
- Reuse shared types and utilities rather than creating parallel definitions.
- Match the import and export style already used by the package. Do not introduce default exports where the package disallows them.
- Keep changes local to the owning package unless a shared concern genuinely belongs in `shared_library/`.

## Testing and Validation

- Add or update tests for changed behavior, including relevant failure and authorization paths.
- Run commands from the package that owns the changed code; packages manage their dependencies and scripts independently.
- Start with the narrowest relevant test, then run that package's lint and type/build checks when practical.
- Do not claim validation that was not performed. Report skipped checks and environmental blockers clearly.
- Common package commands are documented in each package's `package.json` and README.

## Change Review

- Review for concrete defects introduced by the change: incorrect behavior, security or authorization gaps, data integrity risks, missing failure handling, compatibility problems, and meaningful test gaps.
- Verify a concern against surrounding code and established project conventions before raising it.
- Avoid speculative warnings, cosmetic preferences, broad refactors, and suggestions already handled by the change.
- For changes spanning packages, verify that shared types, GraphQL contracts, deployment configuration, and consumers remain synchronized.

