/*
 * Purpose:    Fail-closed completeness + integrity check for crosswalk_document_type (application doc-type subset).
 * Inputs:     mysql_raw.mdcd_demo_aplctn_doc, mysql_raw.crosswalk_document_type, demos_app.document_type
 * Outputs:    none (validation only; RAISEs EXCEPTION on a gap)
 * Invariants: fail-closed; to_regclass-guarded no-op before load; covers the application doc-type family only; a present-but-empty source is a NOTICE no-op; every mapped demos_text_id must exist in the DEMOS document_type seed.
 * Refs:       reports/crosswalks/proposed/_review.md (P4 document_type), sql/04_crosswalks/66_document_type.sql
 *
 * Completeness + integrity check for crosswalk_document_type (application
 * doc-type subset). Guarded by to_regclass so it no-ops before the application
 * document fact table is loaded -- the document/uploaded-files workstream is
 * deferred (reports/crosswalks/proposed/_review.md, P4 document_type), so
 * mysql_raw.mdcd_demo_aplctn_doc is normally absent today.
 *
 * This crosswalk covers ONLY the application doc-type family. The other legacy
 * doc-type families (site-visit, template, reference-material) are a separate
 * reconciliation tracked in _review.md and are NOT validated here.
 *
 * An application with no documents is legitimate, so a present-but-empty
 * source is a NOTICE no-op (mirrors 65_amendment_status_check.sql); we fail
 * closed only when there is a doc-type code with no mapping.
 *
 * (a) every legacy mdcd_demo_aplctn_doc_type_cd present in the loaded source
 *     must have a mapping row;
 * (b) any mapped demos_text_id must exist in the DEMOS document_type seed
 *     (runs independently of the source, as soon as the seed exists).
 */
DO $$
DECLARE
  missing int;
  bad_target int;
BEGIN
  IF to_regclass('mysql_raw.mdcd_demo_aplctn_doc') IS NULL THEN
    RAISE NOTICE 'crosswalk_document_type check: mysql_raw.mdcd_demo_aplctn_doc not loaded yet; completeness deferred';
  ELSIF NOT EXISTS (
      SELECT
        1
      FROM
        mysql_raw.mdcd_demo_aplctn_doc) THEN
    RAISE NOTICE 'crosswalk_document_type check: no source application documents present; nothing to map';
  ELSE
    SELECT
      count(*) INTO missing
    FROM ( SELECT DISTINCT
        mdcd_demo_aplctn_doc_type_cd AS cd
      FROM
        mysql_raw.mdcd_demo_aplctn_doc
      WHERE
        mdcd_demo_aplctn_doc_type_cd IS NOT NULL
      EXCEPT
      SELECT
        legacy_int_cd
      FROM
        mysql_raw.crosswalk_document_type) t;
    IF missing > 0 THEN
      RAISE EXCEPTION 'crosswalk_document_type is missing % legacy application doc-type code(s) present in mdcd_demo_aplctn_doc', missing;
    END IF;
  END IF;
  IF to_regclass('demos_app.document_type') IS NOT NULL AND to_regclass('mysql_raw.crosswalk_document_type') IS NOT NULL THEN
    SELECT
      count(*) INTO bad_target
    FROM
      mysql_raw.crosswalk_document_type x
    WHERE
      x.demos_text_id IS NOT NULL
      AND NOT EXISTS (
        SELECT
          1
        FROM
          demos_app.document_type s
        WHERE
          s.id = x.demos_text_id);
    IF bad_target > 0 THEN
      RAISE EXCEPTION 'crosswalk_document_type has % demos_text_id value(s) not in demos_app.document_type', bad_target;
    END IF;
  END IF;
END
$$;

