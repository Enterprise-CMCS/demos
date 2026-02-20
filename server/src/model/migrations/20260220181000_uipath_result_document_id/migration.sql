ALTER TABLE "uipath_result"
  ADD COLUMN "document_id" UUID;

CREATE INDEX "uipath_result_document_id_idx"
  ON "uipath_result" ("document_id");
