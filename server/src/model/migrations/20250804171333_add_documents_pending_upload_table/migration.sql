-- CreateTable
CREATE TABLE "document_pending_upload" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "document_type_id" TEXT NOT NULL,
    "bundle_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "document_pending_upload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_pending_upload_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "document_type_id" TEXT NOT NULL,
    "bundle_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "document_pending_upload_history_pkey" PRIMARY KEY ("revision_id")
);

-- AddForeignKey
ALTER TABLE "document_pending_upload" ADD CONSTRAINT "document_pending_upload_document_type_id_fkey" FOREIGN KEY ("document_type_id") REFERENCES "document_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_pending_upload" ADD CONSTRAINT "document_pending_upload_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_pending_upload" ADD CONSTRAINT "document_pending_upload_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "bundle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE PROCEDURE move_document_from_processing_to_clean(
    p_id UUID,
    p_s3_path TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO demos_app.document (id, title, description, s3_path, owner_user_id, document_type_id, bundle_id, created_at, updated_at) 
    SELECT 
        id, title, description, p_s3_path, owner_user_id, document_type_id, bundle_id, created_at, updated_at
    FROM 
        demos_app.document_pending_upload 
    WHERE id = p_id;
    
    DELETE FROM demos_app.document_pending_upload
    WHERE id = p_id;
END;
$$;

CREATE FUNCTION demos_app.get_bundle_id_for_document(p_document_id UUID)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_bundle_id UUID;
BEGIN
    SELECT bundle_id INTO v_bundle_id
    FROM demos_app.document_pending_upload 
    WHERE id = p_document_id;
    
    RETURN v_bundle_id;
END;
$$;