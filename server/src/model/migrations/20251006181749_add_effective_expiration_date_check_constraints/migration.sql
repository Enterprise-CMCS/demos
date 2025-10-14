ALTER TABLE "demos_app"."demonstration"
ADD CONSTRAINT effective_date_check CHECK (effective_date < expiration_date);

ALTER TABLE "demos_app"."modification"
ADD CONSTRAINT effective_date_check CHECK (effective_date < expiration_date);
