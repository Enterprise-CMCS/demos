-- Constraining fields to be non-empty
ALTER TABLE "demos_app"."modification" ADD CONSTRAINT check_non_empty_name CHECK (trim("name") != '');
ALTER TABLE "demos_app"."document" ADD CONSTRAINT check_non_empty_name CHECK (trim("name") != '');
ALTER TABLE "demos_app"."document" ADD CONSTRAINT check_non_empty_description CHECK (trim("description") != '');
ALTER TABLE "demos_app"."document" ADD CONSTRAINT check_non_empty_s3_path CHECK (trim("s3_path") != '');
ALTER TABLE "demos_app"."document" ADD CONSTRAINT check_s3_path_start CHECK ("s3_path" ~ '^s3://');
