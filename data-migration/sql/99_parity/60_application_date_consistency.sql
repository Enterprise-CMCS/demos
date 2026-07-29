/*
 * Purpose:    Durable per-row log of loaded application_date rows that would fail DEMOS's own date validation (wrong Eastern boundary, broken ordering, broken fixed offset, or a missing offset counterpart).
 * Inputs:     demos_app.application_date; migration.date_type_expected_timestamp; migration.application_date_rule
 * Outputs:    migration._parity_application_date_consistency; migration._parity_application_date_consistency_summary
 * Invariants: NON-GATING (quantifies the residual that pairs with the DEMOS-side validation skip; does not RED the gate); conditional-DDL guarded so it is a no-op on harnesses that never build application_date; idempotent via CREATE OR REPLACE.
 * Refs:       sql/02_seeds_static/36_application_date_rule.sql; sql/10_stg/27_application_milestone.sql; server/src/model/applicationDate/validateInputDates.ts; docs/specs/api-validation-migration-audit-spec.md
 *
 * DEMOS validates application dates only on the GraphQL mutation path
 * (validateInputDates), so a bulk load cannot trip it. The rules still matter
 * after cutover: they run against the merged date map the moment a user edits
 * ANY date on the application, so a migrated row that violates them turns into
 * an error the user cannot clear without editing data they may not own.
 *
 * Three violation modes, matching the three server rule families:
 *
 *   boundary            date_value is not exactly Eastern start-of-day
 *                       (00:00:00.000) or end-of-day (23:59:59.999) as that
 *                       date type requires. The milestone loader already
 *                       normalizes through migration.eastern_day_start/_end
 *                       (sql/10_stg/27_application_milestone.sql), so this
 *                       should be empty; it is checked anyway because the
 *                       normalization is per-column and a new date type wired
 *                       to the wrong helper would otherwise be silent, and
 *                       because start/end polarity must match the target's
 *                       expectation, not merely be *a* boundary.
 *   missing_counterpart the application holds one half of an ordering or offset
 *                       pair. This is a violation in DEMOS even though the
 *                       value present is unobjectionable, because
 *                       getDateValueFromApplicationDateMap() throws on the
 *                       absent side rather than skipping the rule. It cannot be
 *                       fixed without fabricating the missing date, so it is
 *                       reported, not repaired.
 *   ordering            a completion date precedes its start date.
 *   offset              a pair that must sit a fixed +/-15, +/-30 or +/-1 days
 *                       apart does not. Compared on the Eastern calendar date
 *                       only, mirroring the server's doYMDMatch (comparing
 *                       instants would produce false positives across a DST
 *                       change and for legitimate end-of-day values).
 */
DO $do$
BEGIN
  IF to_regclass('demos_app.application_date') IS NULL OR to_regclass('migration.application_date_rule') IS NULL OR to_regclass('migration.date_type_expected_timestamp') IS NULL THEN
    RETURN;
  END IF;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_application_date_consistency AS
    WITH boundary AS (
      SELECT
        ad.application_id                                    AS application_id,
        ad.date_type_id                                      AS date_type_id,
        'boundary'::text                                     AS violation,
        NULL::text                                           AS counterpart_date_type_id,
        format(
          'expected %s (Eastern), got %s',
          e.expected_timestamp,
          to_char(ad.date_value AT TIME ZONE 'America/New_York', 'HH24:MI:SS.MS')
        )                                                    AS detail
      FROM demos_app.application_date ad
      JOIN migration.date_type_expected_timestamp e ON e.date_type_id = ad.date_type_id
      WHERE ad.date_value IS NOT NULL
        AND to_char(ad.date_value AT TIME ZONE 'America/New_York', 'HH24:MI:SS.MS') <> CASE
              WHEN e.expected_timestamp = 'Start of Day' THEN '00:00:00.000'
              ELSE '23:59:59.999'
            END
    ),
    -- One row per (application_date row, rule that applies to it), carrying the
    -- counterpart value when the application holds it.
    paired AS (
      SELECT
        ad.application_id                                    AS application_id,
        ad.date_type_id                                      AS date_type_id,
        ad.date_value                                        AS date_value,
        r.rule_kind                                          AS rule_kind,
        r.target_date_type_id                                AS target_date_type_id,
        r.offset_days                                        AS offset_days,
        tgt.date_value                                       AS target_date_value
      FROM demos_app.application_date ad
      JOIN migration.application_date_rule r ON r.date_type_id = ad.date_type_id
      LEFT JOIN demos_app.application_date tgt
        ON tgt.application_id = ad.application_id
       AND tgt.date_type_id = r.target_date_type_id
       AND tgt.date_value IS NOT NULL
      WHERE ad.date_value IS NOT NULL
    ),
    missing_counterpart AS (
      SELECT
        p.application_id,
        p.date_type_id,
        'missing_counterpart'::text                          AS violation,
        p.target_date_type_id                                AS counterpart_date_type_id,
        format(
          '%s rule against %s cannot be evaluated: the application has no %s',
          p.rule_kind, p.target_date_type_id, p.target_date_type_id
        )                                                    AS detail
      FROM paired p
      WHERE p.target_date_value IS NULL
    ),
    ordering AS (
      SELECT
        p.application_id,
        p.date_type_id,
        'ordering'::text                                     AS violation,
        p.target_date_type_id                                AS counterpart_date_type_id,
        format(
          'must be >= %s, but %s < %s',
          p.target_date_type_id,
          (p.date_value AT TIME ZONE 'America/New_York')::date,
          (p.target_date_value AT TIME ZONE 'America/New_York')::date
        )                                                    AS detail
      FROM paired p
      WHERE p.rule_kind = 'gte'
        AND p.target_date_value IS NOT NULL
        AND p.date_value < p.target_date_value
    ),
    offsets AS (
      SELECT
        p.application_id,
        p.date_type_id,
        'offset'::text                                       AS violation,
        p.target_date_type_id                                AS counterpart_date_type_id,
        format(
          'must be %s %s day(s); expected %s, got %s',
          p.target_date_type_id,
          CASE WHEN p.offset_days >= 0 THEN '+' || p.offset_days ELSE p.offset_days::text END,
          (p.target_date_value AT TIME ZONE 'America/New_York')::date
            + (p.offset_days || ' days')::interval,
          (p.date_value AT TIME ZONE 'America/New_York')::date
        )                                                    AS detail
      FROM paired p
      WHERE p.rule_kind = 'offset'
        AND p.target_date_value IS NOT NULL
        -- Server compares year/month/day only (doYMDMatch), in Eastern time.
        AND (p.date_value AT TIME ZONE 'America/New_York')::date
            <> ((p.target_date_value AT TIME ZONE 'America/New_York')::date
                + (p.offset_days || ' days')::interval)::date
    )
    SELECT * FROM boundary
    UNION ALL SELECT * FROM missing_counterpart
    UNION ALL SELECT * FROM ordering
    UNION ALL SELECT * FROM offsets;
  $v$;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_application_date_consistency_summary AS
    SELECT
      c.violation                                  AS violation,
      c.date_type_id                               AS date_type_id,
      count(*)                                     AS violation_count,
      count(DISTINCT c.application_id)             AS application_count
    FROM migration._parity_application_date_consistency c
    GROUP BY c.violation, c.date_type_id;
  $v$;
END
$do$;

