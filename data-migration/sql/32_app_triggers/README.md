# 32_app_triggers/

**Intentionally empty.** Application-level triggers on `demos_app.*` —
in particular the `log_changes_*` history-capture triggers — are **owned
by DEMOS**, not by this migration.

- The trigger functions + triggers live in the DEMOS repo at
  `server/src/sql/history_triggers.sql` and are applied by the DEMOS
  deploy via `server/src/refreshDbObjects.ts` (alongside `functions.sql`,
  `utility_views.sql`, `permissions.sql`, `cron_schedules.sql`).
- This migration must **not** author or install those triggers. The
  migration does not populate the `*_history` tables at all; they ship
  empty for the DEMOS capture triggers to fill post-cutover (see
  `reports/narrative/history_strategy.md`).

A prior plan to hand-author history-capture triggers here was dropped as
superseded once the DEMOS repo was confirmed as the owner.
