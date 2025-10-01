CREATE OR REPLACE FUNCTION demos_app.log_changes_document()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.document_history (
            revision_type,
            id,
            name,
            description,
            s3_path,
            owner_user_id,
            document_type_id,
            bundle_id,
            phase_id,
            created_at,
            updated_at
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::demos_app.revision_type_enum
                WHEN 'UPDATE' THEN 'U'::demos_app.revision_type_enum
            END,
            NEW.id,
            NEW.name,
            NEW.description,
            NEW.s3_path,
            NEW.owner_user_id,
            NEW.document_type_id,
            NEW.bundle_id,
            NEW.phase_id,
            NEW.created_at,
            NEW.updated_at
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.document_history (
            revision_type,
            id,
            name,
            description,
            s3_path,
            owner_user_id,
            document_type_id,
            bundle_id,
            phase_id,
            created_at,
            updated_at
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.id,
            OLD.name,
            OLD.description,
            OLD.s3_path,
            OLD.owner_user_id,
            OLD.document_type_id,
            OLD.bundle_id,
            OLD.phase_id,
            OLD.created_at,
            OLD.updated_at
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_document_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.document
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_document();

CREATE OR REPLACE FUNCTION demos_app.log_changes_document_pending_upload()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.document_pending_upload_history (
            revision_type,
            id,
            name,
            description,
            owner_user_id,
            document_type_id,
            bundle_id,
            phase_id,
            created_at,
            updated_at
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::demos_app.revision_type_enum
                WHEN 'UPDATE' THEN 'U'::demos_app.revision_type_enum
            END,
            NEW.id,
            NEW.name,
            NEW.description,
            NEW.owner_user_id,
            NEW.document_type_id,
            NEW.bundle_id,
            NEW.phase_id,
            NEW.created_at,
            NEW.updated_at
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.document_pending_upload_history (
            revision_type,
            id,
            name,
            description,
            owner_user_id,
            document_type_id,
            bundle_id,
            phase_id,
            created_at,
            updated_at
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.id,
            OLD.name,
            OLD.description,
            OLD.owner_user_id,
            OLD.document_type_id,
            OLD.bundle_id,
            OLD.phase_id,
            OLD.created_at,
            OLD.updated_at
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_document_pending_upload_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.document_pending_upload
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_document_pending_upload();

CREATE OR REPLACE PROCEDURE
demos_app.move_document_from_processing_to_clean(
    p_id UUID,
    p_s3_path TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN

    IF NOT EXISTS (SELECT id FROM demos_app.document_pending_upload WHERE id = p_id) THEN
        RAISE EXCEPTION 'No document_pending_upload found for id: %', p_id;
    END IF;

    INSERT INTO demos_app.document (
        id,
        name,
        description,
        s3_path,
        owner_user_id,
        document_type_id,
        bundle_id,
        created_at,
        updated_at
    )
    SELECT
        id,
        name,
        description,
        p_s3_path,
        owner_user_id,
        document_type_id,
        bundle_id,
        created_at,
        updated_at
    FROM
        demos_app.document_pending_upload
    WHERE id = p_id;

    DELETE FROM
        demos_app.document_pending_upload
    WHERE
        id = p_id;

    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to move document from processing to clean. Details: %', SQLERRM;
END;
$$;