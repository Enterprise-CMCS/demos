/*
 * Purpose:    Fail-closed completeness + integrity check for crosswalk_deliverable_file_type (deliverable-file type subset).
 * Inputs:     mysql_raw.mdcd_dlvrbl_fil_doc, mysql_raw.crosswalk_deliverable_file_type, demos_app.document_type
 * Outputs:    none (validation only; RAISEs EXCEPTION on a gap)
 * Invariants: fail-closed; to_regclass-guarded no-op before load; covers the deliverable-file family only; a present-but-empty source is a NOTICE no-op; NULL fil_doc_cd (General File default, D2) is not a code and is exempt; every mapped demos_text_id must exist in the DEMOS document_type seed.
 * Refs:       docs/specs/document-migration.md (D2, D3, D6), sql/04_crosswalks/71_deliverable_file_type.sql
 *
 * Completeness + integrity check for crosswalk_deliverable_file_type
 * (deliverable-file type subset). Guarded by to_regclass so it no-ops before
 * the deliverable-file fact table is loaded -- the document/uploaded-files
 * workstream is deferred (metadata-only loader blocked on the s3_path
 * strategy), so mysql_raw.mdcd_dlvrbl_fil_doc may be absent in standalone dev.
 *
 * This crosswalk covers ONLY the deliverable-file family. The other legacy
 * doc-type families (application, site-visit, reference-material) are a separate
 * reconciliation and are NOT validated here.
 *
 * A deliverable with no files is legitimate, so a present-but-empty source is a
 * NOTICE no-op (mirrors 67_document_type_check.sql); we fail closed only when
 * there is a populated fil_doc_cd with no mapping. NULL fil_doc_cd is the D2
 * General File default (applied by the loader, not mapped here) and is exempt
 * from completeness.
 *
 * (a) every populated fil_doc_cd present in the loaded source must have a
 *     mapping row;
 * (b) any mapped demos_text_id must exist in the DEMOS document_type seed
 *     (runs independently of the source, as soon as the seed exists). Excluded
 *     codes (D3 BN) carry a NULL demos_text_id and are exempt from (b).
 */
DO $$
DECLARE
  missing int;
  bad_target int;
BEGIN
  IF to_regclass('mysql_raw.mdcd_dlvrbl_fil_doc') IS NULL THEN
    RAISE NOTICE 'crosswalk_deliverable_file_type check: mysql_raw.mdcd_dlvrbl_fil_doc not loaded yet; completeness deferred';
  ELSIF NOT EXISTS (
      SELECT
        1
      FROM
        mysql_raw.mdcd_dlvrbl_fil_doc) THEN
    RAISE NOTICE 'crosswalk_deliverable_file_type check: no source deliverable files present; nothing to map';
  ELSE
    SELECT
      count(*) INTO missing
    FROM ( SELECT DISTINCT
        fil_doc_cd AS cd
      FROM
        mysql_raw.mdcd_dlvrbl_fil_doc
      WHERE
        fil_doc_cd IS NOT NULL
      EXCEPT
      SELECT
        legacy_int_cd
      FROM
        mysql_raw.crosswalk_deliverable_file_type) t;
    IF missing > 0 THEN
      RAISE EXCEPTION 'crosswalk_deliverable_file_type is missing % populated fil_doc_cd value(s) present in mdcd_dlvrbl_fil_doc', missing;
    END IF;
  END IF;
  IF to_regclass('demos_app.document_type') IS NOT NULL AND to_regclass('mysql_raw.crosswalk_deliverable_file_type') IS NOT NULL THEN
    SELECT
      count(*) INTO bad_target
    FROM
      mysql_raw.crosswalk_deliverable_file_type x
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
      RAISE EXCEPTION 'crosswalk_deliverable_file_type has % demos_text_id value(s) not in demos_app.document_type', bad_target;
    END IF;
  END IF;
END
$$;

