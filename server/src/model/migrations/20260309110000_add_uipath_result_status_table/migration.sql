SET search_path TO demos_app;

CREATE TABLE "uipath_result_status" (
  "id" TEXT NOT NULL,

  CONSTRAINT "uipath_result_status_pkey" PRIMARY KEY ("id")
);

INSERT INTO "uipath_result_status" ("id")
VALUES
  ('Pending'),
  ('Finished'),
  ('Failed');

ALTER TABLE "uipath_result"
  ADD COLUMN "status_id" TEXT NOT NULL DEFAULT 'Pending';

ALTER TABLE "uipath_result"
  ADD CONSTRAINT "uipath_result_status_id_fkey"
  FOREIGN KEY ("status_id") REFERENCES "uipath_result_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
