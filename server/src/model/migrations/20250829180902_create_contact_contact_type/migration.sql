-- CreateTable
CREATE TABLE "demos_app"."contact" (
    "id" UUID NOT NULL,
    "contact_type_id" TEXT NOT NULL,
    "bundle_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."contact_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "demos_app"."revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "contact_type_id" TEXT NOT NULL,
    "bundle_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "contact_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "demos_app"."contact_type" (
    "id" TEXT NOT NULL,

    CONSTRAINT "contact_type_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contact_contact_type_id_bundle_id_user_id_key" ON "demos_app"."contact"("contact_type_id", "bundle_id", "user_id");

-- AddForeignKey
ALTER TABLE "demos_app"."contact" ADD CONSTRAINT "contact_contact_type_id_fkey" FOREIGN KEY ("contact_type_id") REFERENCES "demos_app"."contact_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."contact" ADD CONSTRAINT "contact_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "demos_app"."bundle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."contact" ADD CONSTRAINT "contact_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "demos_app"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "contact_type" ("id")
VALUES
  ('Project Officer'),
  ('State Point of Contact'),
  ('DDME Analyst'),
  ('Policy Technical Director'),
  ('Monitoring & Evaluation Technical Director');

CREATE OR REPLACE FUNCTION demos_app.log_changes_contact()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.contact_history (
            revision_type,
            id,
            contact_type_id,
            bundle_id,
            user_id,
            created_at,
            updated_at
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::demos_app.revision_type_enum
                WHEN 'UPDATE' THEN 'U'::demos_app.revision_type_enum
            END,
            NEW.id,
            NEW.contact_type_id,
            NEW.bundle_id,
            NEW.user_id,
            NEW.created_at,
            NEW.updated_at
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.contact_history (
            revision_type,
            id,
            contact_type_id,
            bundle_id,
            user_id,
            created_at,
            updated_at
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.id,
            OLD.contact_type_id,
            OLD.bundle_id,
            OLD.user_id,
            OLD.created_at,
            OLD.updated_at
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_contact_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.contact
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_contact();

