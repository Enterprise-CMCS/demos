-- Keep only the newest UiPath result row per request_id.
WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY request_id
      ORDER BY created_at DESC, id DESC
    ) AS rn
  FROM "uipath_result"
)
DELETE FROM "uipath_result" r
USING ranked
WHERE r.id = ranked.id
  AND ranked.rn > 1;

-- Keep only one field row per (uipath_result_id, field_id).
WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY uipath_result_id, field_id
      ORDER BY id DESC
    ) AS rn
  FROM "uipath_result_field"
)
DELETE FROM "uipath_result_field" f
USING ranked
WHERE f.id = ranked.id
  AND ranked.rn > 1;

-- Enforce idempotency for request-level and field-level saves.
CREATE UNIQUE INDEX "uipath_result_request_id_key" ON "uipath_result"("request_id");
CREATE UNIQUE INDEX "uipath_result_field_result_field_key"
  ON "uipath_result_field"("uipath_result_id", "field_id");
