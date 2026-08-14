# 50_sequences/

Intentionally empty for the demonstration entity: `app.demonstration.id`
is a `uuid` (see `docs/developer/reference-data-dictionary.adoc`),
and the DEMOS backend mints new UUIDs without a PG sequence. There is
nothing to `setval` after the migration to align with post-cutover
inserts -- new demonstration IDs are created post-migration by the
backend and are out of scope (see
`docs/developer/reference-id-maps.adoc` "Demonstration provenance").

Other entities may add files here later if they expose integer
sequences whose post-cutover next-value must be aligned to the max
legacy id consumed by `mysql_raw`.
