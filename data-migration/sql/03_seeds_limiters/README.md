# `sql/03_seeds_limiters/`

Applied by `migrate seeds` after `sql/02_seeds_static/`.

**Intentionally empty.** The 14 DEMOS type-limiter tables
(`amendment_application_type_limit`, `cms_user_person_type_limit`,
`demonstration_grant_level_limit`, `user_person_type_limit`, …) are part
of the Prisma-owned `app.*` schema and are **seeded by the Prisma
artifact** that `migrate ddl` applies. There is no migration-authored
limiter seed to add here; see `sql/02_seeds_static/README.md` for the
full rationale on the DDL-ownership pivot.
