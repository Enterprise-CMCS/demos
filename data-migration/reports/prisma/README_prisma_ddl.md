# Prisma DDL pin

`prisma_ddl.sha256` holds the expected SHA256 of the **concatenated**
Prisma migration set published by the DEMOS app team in the
[Enterprise-CMCS/demos](https://github.com/Enterprise-CMCS/demos) repo
under `server/src/model/migrations/`. Each Prisma migration is its own
timestamp-prefixed directory containing a single `migration.sql`;
`migrate fetch-prisma` lists those directories via the GitHub Contents
API, fetches each `migration.sql` from `raw.githubusercontent.com`,
concatenates them chronologically, hashes the result, and **fails
loudly** if the SHA256 does not match this file.

This file now holds a real pin (a 64-character hex SHA256). To bump it
when the DEMOS team adds or changes a migration:

```sh
uv run migrate fetch-prisma   # will fail with the actual sha in the error
# copy the "composed migration set sha256 ..." value from the error and:
echo "<new sha>" > reports/prisma_ddl.sha256
uv run migrate fetch-prisma   # now succeeds and caches the artifact
```

Or, to compute the hash without going through the failure path:

```sh
PRISMA_REPO=Enterprise-CMCS/demos PRISMA_REPO_REF=main \
  uv run python -c "
from migration.lib import Env
from migration.phases.fetch_prisma import _compose_ddl
import hashlib
body, dirs = _compose_ddl(Env.load())
print(hashlib.sha256(body).hexdigest())
print('\n'.join(dirs))
"
```

Open a PR with the new hash plus a note in the description naming the
DEMOS commit and the migration directories included. CI runs
`migrate fetch-prisma --verify-only` so PRs that bump the pin without
matching upstream changes (or vice versa) fail.

`prisma_ddl_source.txt` is written by `migrate fetch-prisma` after a
successful fetch and records the repo, ref, path, sha256, ordered
migration list, and timestamp. It is regenerated on every fetch and not
committed.
