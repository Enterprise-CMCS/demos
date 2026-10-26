# DEMOS Lambda Agent Guidelines

These instructions apply to all standalone Lambda packages under `lambdas/`. Also follow the repository-level `AGENTS.md` and any package README relevant to the change.

## Architecture

- Each immediate subdirectory is an independently installed and deployed TypeScript package with its own `package.json`, lockfile, TypeScript configuration, tests, and Lambda entry point.
- `index.ts` is generally the AWS handler boundary. Keep event parsing and response or batch-failure behavior compatible with the service that invokes it, such as SQS, API Gateway authorizers, or scheduled events.
- Keep database, AWS SDK, external-service, and formatting logic in the package's existing focused modules instead of expanding the handler unnecessarily.
- Reuse `demos-shared-library` for shared contracts and utilities. Do not create cross-Lambda imports or duplicate shared domain types when the shared library is the appropriate owner.
- Infrastructure wiring, permissions, queues, triggers, and environment configuration belong in `deployment/`; keep runtime implementation in the owning Lambda package.

## Runtime and Data Safety

- Treat Lambda events, queue messages, document contents, database values, and external-service responses as untrusted input. Validate required fields and fail predictably on malformed data.
- Preserve the handler's retry and idempotency behavior. For queue consumers, distinguish retryable failures from records that must not be processed again, and do not acknowledge work before durable side effects complete.
- Account for Lambda retries and partial execution when writing to PostgreSQL, S3, SQS, Secrets Manager, Parameter Store, SMTP, or external APIs. Avoid duplicate messages, updates, exports, or notifications.
- Reuse established connection pools and SDK clients outside the handler where the package already does so; do not create a new database pool or service client for every record.
- Keep database changes transactional when multiple writes must succeed or fail together. Use parameterized queries and preserve schema and contract compatibility with server and deployment consumers.
- Do not hard-code regions, resource identifiers, queue URLs, credentials, secrets, hostnames, or stage-specific values. Use the package's existing environment and secret-resolution boundaries.
- Never log secrets, tokens, authorization headers, document contents, full event payloads, sensitive database values, or unnecessary personal information. Use the package logger and preserve its redaction behavior.

## AWS and External Services

- Request only the IAM permissions required by the runtime behavior, and update the corresponding deployment code when a Lambda adds or removes an AWS operation.
- Preserve S3 key conventions, SQS message shapes, database contracts, secret formats, and external API payloads unless all producers and consumers are updated together.
- Handle SDK and external-service failures explicitly. Preserve enough context for diagnosis without exposing sensitive data, and do not silently convert failed work into a successful Lambda result.
- Keep network calls bounded with the established timeout, polling, and retry behavior. Consider the Lambda timeout and remaining execution time before adding sequential or long-running work.
- Use LocalStack or mocks at existing package boundaries for local tests; unit tests must not contact live AWS services, databases, SMTP servers, or third-party APIs.

## TypeScript and Dependencies

- Follow the module format and compiler settings of the Lambda being changed; packages are not uniform between ESM and CommonJS.
- Keep changes within the owning package unless a contract genuinely belongs in `shared_library` or requires matching deployment/server changes.
- Manage dependencies and lockfiles from the individual Lambda directory. Do not install dependencies at `lambdas/` or update unrelated Lambda lockfiles.
- Do not edit generated bundles, coverage output, scanner output, or installed dependencies, including `dist/`, `coverage/`, `.scannerwork/`, and `node_modules/`.

## Testing and Validation

- Place tests beside the implementation as `*.test.ts` and use Vitest with the package's existing mocks and fixtures.
- Cover the successful handler path plus relevant malformed-event, authorization, retry, idempotency, database, and external-service failure paths.
- Assert observable outcomes and service calls rather than private implementation details. Keep fixtures deterministic and avoid real credentials or production-derived sensitive data.
- Run commands from the specific Lambda directory. Common checks are:
  - `npm test -- <path-or-pattern>` for a focused test when supported by the package script.
  - `npm test` for that Lambda's complete test suite and coverage.
  - `npm run lint` for TypeScript validation.
  - Package-specific build commands, such as `npm run build`, when defined.
- When an event or service contract changes, also validate the corresponding producer, consumer, shared type, and deployment configuration.
