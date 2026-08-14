/*
 * Purpose: Heuristic query that derives foreign-key candidates from mysql_raw column naming patterns and emits a COPY-friendly CSV for SME review.
 * Refs:    reports/generated/fk_candidates.csv
 *
 * Generate FK candidates from mysql_raw column naming patterns.
 * Output: COPY-friendly result; redirect to reports/generated/fk_candidates.csv.
 *
 * Usage:
 *   psql "$PG_URL" -At -F',' -f scripts/generate_fk_candidates.sql > reports/generated/fk_candidates.csv
 *
 * Algorithm:
 *   For every column in mysql_raw whose name matches *_id (and isn't the table's PK),
 *   look for a candidate target table by stripping suffixes (_id, _cd) and matching:
 *     - exact (HIGH confidence): column 'demonstration_id' -> table 'demonstration'
 *     - approved/pending pair (HIGH): 'pendg_demo_id' -> 'mdcd_pendg_demo'
 *     - mdcd-prefixed (MEDIUM): 'demo_id' -> 'mdcd_demo'
 *     - reference (HIGH): 'stus_cd' -> '*_stus_rfrnc'
 *     - none -> LOW with notes column blank
 */

WITH cols AS (
  SELECT table_schema AS from_schema,
         table_name   AS from_table,
         column_name  AS from_column,
         data_type    AS from_type
  FROM information_schema.columns
  WHERE table_schema = 'mysql_raw'
    AND (column_name LIKE '%\_id' ESCAPE '\' OR column_name LIKE '%\_cd' ESCAPE '\')
),
pks AS (
  SELECT kcu.table_schema, kcu.table_name, kcu.column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu USING (constraint_schema, constraint_name)
  WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'mysql_raw'
),
tbls AS (
  SELECT table_schema, table_name
  FROM information_schema.tables
  WHERE table_schema = 'mysql_raw' AND table_type = 'BASE TABLE'
),
fk_candidates AS (
  SELECT
    c.from_schema,
    c.from_table,
    c.from_column,
    -- strip _id / _cd suffix to derive the candidate table base name
    regexp_replace(c.from_column, '_(id|cd)$', '') AS base_name,
    c.from_type
  FROM cols c
  LEFT JOIN pks p
    ON p.table_schema = c.from_schema
   AND p.table_name   = c.from_table
   AND p.column_name  = c.from_column
  WHERE p.column_name IS NULL
)
SELECT
  fc.from_schema || '.' || fc.from_table AS from_table_qual,
  fc.from_column,
  COALESCE(t_exact.table_name,
           t_mdcd.table_name,
           t_pendg.table_name,
           t_rfrnc.table_name)            AS to_table,
  -- Resolve the parent's actual single-column primary key (mysql_raw tables
  -- use <table>_id, not the DEMOS-style 'id'); fall back to the old heuristic
  -- guess only when the parent has no single-column PK to read.
  COALESCE(
    (
      SELECT p.column_name
      FROM pks p
      WHERE p.table_schema = fc.from_schema
        AND p.table_name = COALESCE(t_exact.table_name, t_mdcd.table_name,
                                    t_pendg.table_name, t_rfrnc.table_name)
        AND (
          SELECT count(*) FROM pks p2
          WHERE p2.table_schema = p.table_schema
            AND p2.table_name = p.table_name
        ) = 1
    ),
    CASE
      WHEN t_rfrnc.table_name IS NOT NULL THEN 'cd'
      ELSE 'id'
    END
  )                                      AS to_column,
  CASE
    WHEN t_exact.table_name IS NOT NULL THEN 'HIGH'
    WHEN t_pendg.table_name IS NOT NULL THEN 'HIGH'
    WHEN t_rfrnc.table_name IS NOT NULL THEN 'HIGH'
    WHEN t_mdcd.table_name  IS NOT NULL THEN 'MEDIUM'
    ELSE 'LOW'
  END                                    AS confidence,
  ''                                     AS notes
FROM fk_candidates fc
LEFT JOIN tbls t_exact
       ON t_exact.table_schema = fc.from_schema AND t_exact.table_name = fc.base_name
LEFT JOIN tbls t_mdcd
       ON t_mdcd.table_schema = fc.from_schema AND t_mdcd.table_name = 'mdcd_' || fc.base_name
LEFT JOIN tbls t_pendg
       ON t_pendg.table_schema = fc.from_schema AND t_pendg.table_name = 'mdcd_pendg_' || regexp_replace(fc.base_name, '^pendg_', '')
LEFT JOIN tbls t_rfrnc
       ON t_rfrnc.table_schema = fc.from_schema AND t_rfrnc.table_name = fc.base_name || '_rfrnc'
ORDER BY fc.from_table, fc.from_column;
