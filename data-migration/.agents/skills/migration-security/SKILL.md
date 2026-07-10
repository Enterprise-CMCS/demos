---
name: migration-security
version: 1.0.0
description: |
  Use when reviewing or changing credential handling, SQL interpolation,
  Secrets Manager integration, pgloader configuration, connection string
  redaction, healthz probing, or any code that touches sensitive data
  in this migration pipeline. Covers the specific security surfaces
  this codebase exposes: f-string SQL injection, credential leaks in
  logs, trust of external tool exit codes, and non-interactive guards.
---

# Migration security review

This is a production data migration that touches live MySQL (source)
and Postgres (target) databases, resolves credentials from AWS Secrets
Manager, and runs pgloader as an external subprocess. Security review
here is not theoretical: a credential leak in a log or a SQL injection
in a freeze instant could compromise the cutover.

## When to use

- Changing anything in `migration/lib.py` that handles connection
  strings, passwords, or DSNs
- Modifying `migration/secrets.py` or any Secrets Manager integration
- Writing or changing SQL that interpolates values (freeze instants,
  table names, schema names)
- Changing pgloader `.load` files or the `assert_pgloader_ok` wrapper
- Adding or modifying healthz probes, SSL modes, or non-interactive
  guards
- Before any release that ships to a real environment

## Security surfaces (this codebase)

### 1. SQL interpolation

The repo policy (documented in `lib.py:psql_query`) is that values
MUST go through `params`, never f-strings. The one known violation was
in `freeze.py:37` where the freeze instant was interpolated via
f-string (CODE_REVIEW M3). It was safe because the value was
machine-generated and regex-shaped, but it violated the stated policy.

**Check every SQL interpolation:**
- Table/schema names: must use `psycopg.sql.Identifier` (already the
  pattern in `lib.py`)
- Values: must use `psql_query(sql, params=[...])`
- Template rendering: pgloader `.load` files use Jinja2
  `StrictUndefined`; verify no user-controllable values reach templates

### 2. Credential redaction

`lib.redact()` strips passwords from connection strings before logging.
Every `console.print` and `log()` call goes through `redact()`. Check:
- New log paths that bypass `log()` and call `console.print` directly
- Error messages that include raw DSNs or secret values
- `pgloader` log files in `reports/` that might contain credentials
  (these are chmod 0600 via the render step)
- Secrets Manager responses that might be logged in debug mode

### 3. External tool trust

`pgloader` exit codes are NOT trusted (commit a7e87c9). The
`assert_pgloader_ok` function parses the log for error counts. Check:
- Any new external subprocess call that trusts exit code alone
- Error parsing that could miss a partial failure (table errors with
  exit 0)
- Delta loads that reuse the same CAST block (commit 8d653b8) - verify
  the drop list is applied

### 4. Connection security

- DEMOS RDS connections use `sslmode=verify-full` with a cached CA
  bundle (`lib.py:220`)
- Healthz probes are restricted to `http`/`https` schemes only
- `MIGRATE_NONINTERACTIVE` refuses to auto-confirm destructive
  operations
- Check any new connection path that might default to `sslmode=disable`

### 5. Non-interactive guard

The `MIGRATE_NONINTERACTIVE` env var prevents unattended cutover
operations. Verify that any new phase that could destroy data
(truncate, drop, rebuild) checks this guard.

## Review checklist

- [ ] No f-string SQL interpolation for values (use `params` or
      `psycopg.sql.Identifier`)
- [ ] All log output goes through `redact()` or `log()`
- [ ] External tool results are parsed, not just exit-code-checked
- [ ] New DSNs default to `sslmode=verify-full` or higher
- [ ] Destructive phases check `MIGRATE_NONINTERACTIVE`
- [ ] Secrets Manager calls handle missing/malformed secrets via `die()`
- [ ] Rendered files with credentials are chmod 0600
- [ ] No new dependencies that could exfiltrate data (check
      `pyproject.toml`)

## What not to do

- **Don't trust pgloader exit codes.** Parse the log for error counts.
- **Don't log raw connection strings.** Always go through `redact()`.
- **Don't interpolate values into SQL with f-strings**, even if the
  value is "safe" today. Use `params`.
- **Don't skip the SSL mode on new connections.** Default to
  `verify-full` for RDS, `prefer` minimum for local dev.
- **Don't render credential-containing files world-readable.** Use
  `chmod 0600`.
