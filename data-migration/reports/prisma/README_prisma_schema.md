# Prisma schema pin

`prisma_schema.sha256` holds the expected SHA256 of the **concatenated**
declarative Prisma *model* files (`*.prisma`) published by the DEMOS app
team in the [Enterprise-CMCS/demos](https://github.com/Enterprise-CMCS/demos)
repo under `server/src/model/` (`$PRISMA_SCHEMA_PATH`).

This is the model-file companion to `prisma_ddl.sha256`. The compiled
`migration.sql` artifact (pinned by `prisma_ddl.sha256`) is the source of
truth for what `migrate ddl` *applies*; the `.prisma` model files are a
**read-only cross-validation input** consumed by `migrate fk-candidates`
(their `@relation` directives drive FK-candidate reconstruction). Nothing
derived from them is ever applied, so this artifact is **off the cutover
apply path**.

`migrate fetch-prisma-schema` lists the `.prisma` files via the GitHub
Trees API (`recursive=1`, one call) filtered to blobs under
`$PRISMA_SCHEMA_PATH` ending `.prisma`, fetches each from
`raw.githubusercontent.com`, concatenates them path-sorted, hashes the
result, and **fails loudly** if the SHA256 does not match this file.

This file now holds a real pin (a 64-character hex SHA256). To bump it
when the upstream model files change:

```sh
uv run migrate fetch-prisma-schema   # will fail with the actual sha in the error
# copy the "composed model set sha256 ..." value from the error and:
echo "<new sha>" > reports/prisma_schema.sha256
uv run migrate fetch-prisma-schema   # now succeeds and caches the artifact
```

Or, to compute the hash without going through the failure path:

```sh
PRISMA_REPO=Enterprise-CMCS/demos PRISMA_REPO_REF=main \
  uv run python -c "
from migration.lib import Env
from migration.phases.fetch_prisma_schema import _compose_schema
import hashlib
body, files = _compose_schema(Env.load())
print(hashlib.sha256(body).hexdigest())
print('\n'.join(files))
"
```

Open a PR with the new hash plus a note in the description naming the
DEMOS commit and the model files included. CI runs
`migrate fetch-prisma-schema --verify-only` so PRs that bump the pin
without matching upstream changes (or vice versa) fail.

`prisma_schema_source.txt` is written by `migrate fetch-prisma-schema`
after a successful fetch and records the repo, ref, root, sha256, ordered
file list, and timestamp. It is regenerated on every fetch and not
committed.
