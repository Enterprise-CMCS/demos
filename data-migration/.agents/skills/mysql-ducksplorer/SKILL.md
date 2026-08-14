---
name: mysql-ducksplorer
version: 1.0.0
description: |
  Run ad-hoc, read-only analysis queries against a MySQL database using
  DuckDB's MySQL extension, without installing a Python MySQL driver and
  without exposing the password. Use when you need to explore/profile a
  source MySQL DB (counts, distributions, distinct values, free-text
  categorization) for a migration or investigation, especially when the
  project already depends on DuckDB but has no pymysql/mysqlclient/connector,
  or when you only have a connection URL in a .env file.
---

# mysql-ducksplorer

Explore a MySQL database with DuckDB as the query engine. DuckDB attaches the
live MySQL schema and you query it with normal SQL, so you get DuckDB's
ergonomics (CSV/Parquet export, casts, aggregation) over remote MySQL tables.
This avoids adding a MySQL driver to the project and keeps credentials out of
logs.

## When to reach for this

- The project depends on `duckdb` but not on `pymysql` / `mysqlclient` /
  `mysql-connector`, and you want a one-off read-only query.
- You only have a `MYSQL_URL` (or host/user/pass/db) in `.env` and must not
  echo the password.
- You are profiling a source DB for a migration: row counts, flag
  distributions, distinct values, joining a fact table to its `*_rfrnc`
  lookup, or pulling a small set of free-text comments to categorize.

For bulk data movement use the project's real loader (e.g. pgloader). This
skill is for exploration, not ETL.

## Prerequisites

- `duckdb` Python package available (or the `duckdb` CLI).
- Network access from the host to the MySQL server.
- The MySQL extension downloads on first `INSTALL mysql;` (needs internet).

## The workflow

1. Get connection parts without printing the password. If the project has a
   settings loader, use it; otherwise read `.env`. Parse the URL with
   `urllib.parse.urlparse` and `unquote` each part.
2. Build a libmysql-style DSN string: `host=... port=... user=... password=...
   database=...`.
3. `INSTALL mysql; LOAD mysql;` then `ATTACH '<dsn>' AS my (TYPE mysql)`.
4. Query `my.<table>` read-only. Cast MySQL tinyint/bool to int for `SUM`.

### Working snippet (Python)

```python
from urllib.parse import unquote, urlparse
import duckdb

# Option A: project loader keeps the password out of your view.
#   from migration.lib import Env
#   mysql_url = Env.load().mysql_url
# Option B: read it yourself.
#   import os; from dotenv import load_dotenv; load_dotenv(); mysql_url = os.environ["MYSQL_URL"]

u = urlparse(mysql_url)
parts = {
    "host": u.hostname or "",
    "port": str(u.port or 3306),
    "user": unquote(u.username or ""),
    "password": unquote(u.password or ""),
    "database": (u.path or "/").lstrip("/"),
}
dsn = " ".join(f"{k}={v}" for k, v in parts.items())

con = duckdb.connect()
con.execute("INSTALL mysql; LOAD mysql;")
try:
    # ATTACH does NOT accept bind parameters; inline the DSN and escape quotes.
    con.execute(f"ATTACH '{dsn.replace(chr(39), chr(39) * 2)}' AS my (TYPE mysql)")
except Exception as e:
    # Never let the DSN (password) surface in a traceback.
    raise RuntimeError(f"MySQL ATTACH failed: {type(e).__name__}") from None

# Now query MySQL through DuckDB:
print(con.execute("SELECT COUNT(*) FROM my.some_table").fetchone()[0])
```

### Common query shapes

```sql
-- flag distribution joined to its reference/lookup table
SELECT d.some_flag, r.name, COUNT(*) AS n
FROM my.fact_table d
LEFT JOIN my.some_rfrnc r ON r.code = d.some_code
GROUP BY 1, 2 ORDER BY n DESC;

-- boolean SUMs: cast first (MySQL bool comes back as a tinyint)
SELECT SUM((some_flag = 1)::int) FROM my.fact_table;

-- pull a small set of free-text values to read/categorize
SELECT TRIM(comment_col) AS c, COUNT(*) n
FROM my.fact_table
WHERE comment_col IS NOT NULL AND TRIM(comment_col) <> ''
GROUP BY 1 ORDER BY n DESC;
```

Export when useful: `COPY (SELECT ...) TO 'out.csv' (HEADER, DELIMITER ',')`.

## Gotchas (these bit me, save yourself the time)

- **`ATTACH` rejects bind parameters.** `ATTACH ? AS my (...)` raises
  `Parser Error: syntax error at or near "?"`. You must inline the DSN string.
  Because you are inlining, escape single quotes (`'` -> `''`) and wrap the
  whole thing in a try/except that prints only the exception type, so the
  password never lands in a traceback or log.
- **Password redaction.** Do not `print(dsn)` or pass the URL to a shell that
  logs argv. Build the DSN in-process. If a project loader exists (pydantic
  settings, etc.), prefer it so you never see the secret.
- **MySQL booleans.** `SUM(flag = 1)` may error or behave oddly in DuckDB; cast
  with `(flag = 1)::int`.
- **Soft deletes / scope.** Source tables often carry `dltd_ind` (or similar);
  add `WHERE dltd_ind = 0` unless you specifically want deleted rows. Live
  counts will differ from any stale schema snapshot.
- **Missing driver is the trigger, not a blocker.** If `pip`/`uv` shows no
  pymysql and the project already has duckdb, do not add a new dependency;
  use this.
- **First run needs internet** for `INSTALL mysql;`. On an air-gapped box this
  will fail.

## Clean up

If you `uv pip install`ed anything to try a driver before remembering DuckDB,
uninstall it. Delete throwaway probe scripts. Leave the environment as you
found it (DuckDB is usually already a project dep, so nothing to remove).

## Verify it worked

- `SELECT COUNT(*) FROM my.<table>` returns a number, not an auth error.
- A join to a `*_rfrnc` lookup resolves names (proves the schema attached, not
  just the connection).
- The password never appears in any printed output, log line, or traceback.
