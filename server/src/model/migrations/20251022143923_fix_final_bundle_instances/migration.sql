-- These are old and should have been removed earlier
DROP FUNCTION demos_app.log_changes_demonstration_status;
DROP FUNCTION demos_app.log_changes_modification_status;
DROP FUNCTION demos_app.log_changes_user_role;
DROP FUNCTION demos_app.log_changes_user_state;
DROP FUNCTION demos_app.log_changes_user_state_demonstration;

-- Replaces the bundle with application here
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
        application_id,
        phase_id,
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
        application_id,
        phase_id,
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
