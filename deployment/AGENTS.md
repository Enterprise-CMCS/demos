# DEMOS Deployment Agent Guidelines

These instructions apply to the AWS CDK deployment code and `demosctl`. Also follow the repository-level `AGENTS.md`.

## Architecture

- Deployment infrastructure is written in TypeScript with AWS CDK.
- `app.ts` composes stacks and their dependencies; `config.ts` resolves stage and host-environment configuration.
- `stacks/` owns deployable CloudFormation stacks.
- `lib/` owns reusable constructs and Lambda handlers used by the stacks.
- `util/` contains focused deployment helpers.
- `demosctl/` provides lifecycle commands used locally and by Jenkins, including ephemeral-environment management.
- `cdk.out/`, coverage output, generated output JSON, and temporary certificate files are artifacts, not source files.

## CDK and Configuration

- Follow existing stack and construct boundaries. Put reusable resource composition in `lib/` and environment-level orchestration in `stacks/`.
- Pass shared configuration through the established stack props instead of reading new environment variables throughout constructs.
- Preserve explicit stack dependencies when one stack consumes resources or parameters created by another.
- Keep stage handling compatible with `dev`, `test`, `impl`, `prod`, `bootstrap`, and ephemeral environments.
- Do not hard-code account IDs, regions, secrets, certificate data, environment hostnames, or stage-specific resource identifiers when configuration or SSM/Secrets Manager is the established source.
- Preserve the expected-account guard and least-privilege IAM boundaries. Treat IAM, security groups, KMS, WAF, Cognito, networking, logging, backup, and public-access changes as security-sensitive.
- Apply the repository's standard `STAGE` and `PROJECT` tags to new resources through the existing app-level behavior.
- Keep CDK and CloudFormation logical identities stable when possible; unnecessary construct-ID changes can replace resources.
- Do not add `cdk-nag` or Checkov suppressions merely to make checks pass. A suppression must be narrowly scoped and include a concrete justification when the tool supports one.

## Safe Infrastructure Changes

- Inspect the synthesized template or CDK diff for every material infrastructure change.
- Flag replacements, deletions, IAM expansion, public exposure, stateful-resource changes, and cross-stage effects explicitly.
- Never run `cdk deploy`, `demosctl up`, `demosctl down`, or another command that mutates an AWS environment unless the user explicitly requests it and the target account, region, and stage are known.
- Prefer `npm run diff` or `npm run synth:dev` for read-only validation, while recognizing that context lookups may still require AWS access.
- Preserve retention, backup, encryption, access logging, and deletion-protection behavior for stateful or security-relevant resources unless the requested change intentionally alters it.
- Avoid reading live secrets into synthesized output, logs, snapshots, or tests.

## TypeScript and Testing

- Use two-space indentation, double quotes, semicolons, strict equality, object shorthand, and the formatting enforced by `deployment/eslint.config.js`.
- Handle promises explicitly; do not introduce floating or misused promises.
- Place tests beside their source as `*.test.ts` and use Vitest.
- Use CDK assertions or existing test helpers to verify resource properties, policies, dependencies, conditions, and security controls.
- Tests must be deterministic and must not contact live AWS services. Mock configuration, SDK clients, SSM, and Secrets Manager at established boundaries.
- Update tests when a synthesized resource or policy change is intentional; do not broadly weaken assertions.

## Validation

- From `deployment/`, common checks are:
  - `npm test -- <path-or-pattern>` for focused tests.
  - `npm run test:ci` for the complete CI-style suite and coverage.
  - `npm run lint` for formatting and static analysis.
  - `npm run tsc` for type checking.
  - `npm run synth:dev` to synthesize development templates when the required AWS context is available.
- Review `cdk diff` output before any deployment and report when synthesis or diffing could not be performed because credentials or environment context were unavailable.
