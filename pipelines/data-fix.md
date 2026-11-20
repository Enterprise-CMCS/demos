# Data-fix Jenkins pipeline

## Current capability: dev dry run only

This slice checks out `main` with full history, assumes the `dev` AWS role, and invokes the existing `demosctl data-fix` runner with apply disabled. The runner is the only component that connects to the database. Jenkins accepts only a versioned, runner-owned result record and never prints or archives runner stdout or stderr.

The job exposes `ENVIRONMENT=dev`, `FIX_FILE`, and `APPLY=false`. It independently rejects any environment other than `dev`, rejects `APPLY=true` before checkout, and validates the filename against `YYYYMMDD_DEMOS-<ticket>_<lowercase_name>.sql`. It reports when the selected file is absent from `main` and records the checked-out SHA.

The runner creates a per-invocation result file exclusively with mode `0600`; a pre-existing result is rejected before database access. Its bounded record contains a version, validated environment and filename, mode, enumerated outcome, aggregate count when known, allowlisted failure phase, rollback status, and connection-cleanup status. These fields come only from runner transaction state and database acknowledgments, never from stdout, stderr, notices, evidence rows, SQL, or error messages. Jenkins clears any prior result, redirects runner stdout/stderr to `/dev/null`, and retains the process exit status independently. It rejects missing, stale, malformed, mismatched, contradictory, or nonzero results without falling back to text parsing. Workspace cleanup always runs.

There is no apply, reversal, approval, or Jira-comment stage in this slice. `test`, `impl`, and `prod` are not supported.

## Prerequisites for a live dry-run proof

- The runner foundation and this dry-only pipeline must be available from `main`; the job always checks out `main` and must not be changed to run PR contents against a database.
- The selected forward/reverse SQL pair must be explicitly reviewed and present on `main`, and both files must satisfy the runner's pair validation. Confirm that the forward fix is safe for the `dev` database and does not rely on production-only owners, records, uploaded objects, or external effects.
- The required migration, `demos_data_fix` role and permissions, history/deferred guards, and database-object refresh must already be prepared through the normal environment setup.
- Jenkins job configuration and access, Git checkout credentials, AWS role access, and network access must be available. Jira access is not needed for this slice.

Do not use `20261112_DEMOS-3173_reference_material_insert.sql` as a demonstration candidate: it assumes a production-specific owner and uploaded S3 objects. If no reviewed dev-safe pair with satisfied prerequisites exists, record the live proof as blocked rather than modifying the SQL or relaxing environment restrictions.

## Run and record the dry-run proof

After the runner foundation and dry-only slice are merged to `main` and a suitable fix has been reviewed:

1. Start the configured Jenkins job with `ENVIRONMENT=dev`, the exact reviewed `FIX_FILE`, and `APPLY=false`.
2. Record the Jenkins build URL, checkout SHA, environment, fix filename, and its reviewed identity/checksum outside the pipeline summary.
3. Confirm the console reports a completed rollback acknowledged by the runner after the fix body ran. An already-applied no-op proves idempotency only; if the job reports a no-op, the live rollback proof remains blocked. A successful exit code or row count alone is not rollback evidence.
4. Using authorized read-only checks outside Jenkins, verify there is no new ledger row and the fix's scoped application/history state is unchanged. Do not add ledger queries or state inspection to the pipeline.
5. Verify an `APPLY=true` request is rejected and the build workspace is cleaned. Do not enable apply based only on a dry-run build; the live evidence gate and a separate approval are required before the next capability.

Failure summaries may identify an allowlisted runner phase and an aggregate row count when known. Acknowledged, failed, and unconfirmed rollback states are reported distinctly and none turns a failed runner outcome into rollback proof. The raw output is intentionally unavailable in the console; diagnose using the fixed message and authorized, appropriately protected local runner/test procedures rather than printing raw SQL-controlled output.

## Local checks

Run the dependency-free pipeline harness from the repository root with an approved Groovy runtime:

```sh
groovy pipelines/tests/dataFixPipeline.test.groovy
```

The harness loads and executes the actual stages and helpers in `Jenkinsfile.dataFix`; its DSL, shell, checkout, AWS, and filesystem boundaries are simulated, so this is not Jenkins or live integration validation. It verifies dry-only rejection, full-history `main` checkout configuration, container use, runner-result request binding and validation, safe rollback/no-op reporting, runner failure handling, and cleanup. From `deployment/`, run the inherited checks:

```sh
npm test -- --run demosctl/commands/dataFix.test.ts demosctl/demosctl.test.ts
npm run tsc
npm run lint
```

Run the configured detect-secrets hook for the changed pipeline files and inspect whitespace errors before publishing. Groovy/Jenkins validation is separate from the TypeScript checks. If an approved Groovy runtime or authenticated Jenkins validation endpoint is unavailable, report it as blocked; do not claim static inspection executed the harness or declarative validation.

## Tracer-bullet stack

The intended dependency chain is:

```text
main
└── data-fix-standardization/03-runner  (#2114)
    └── DEMOS-3161-jenkinsfile  (this dev dry-run slice)
        └── data-fix-standardization/04a-apply-audit  (future dev/test apply and audit)
            └── data-fix-standardization/04b-protected-gates  (future protected approvals)
```

Use the installed `gh stack` extension to register and publish the stack. Commit only the explicit files for this slice. `05-conventions` remains deferred and must not be added to this stack. Later apply/audit and protected-gate capabilities must not be enabled until the preceding slice's acceptance evidence is recorded.