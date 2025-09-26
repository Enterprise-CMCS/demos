CREATE OR REPLACE FUNCTION demos_app.log_changes_document()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.document_history (
            revision_type,
            id,
            title,
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
            NEW.title,
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
            title,
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
            OLD.title,
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
            title,
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
            NEW.title,
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
            title,
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
            OLD.title,
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

-- Replace Old Stored Procedure
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
        title,
        description,
        s3_path,
        owner_user_id,
        document_type_id,
        bundle_id,
        phase_id,
        created_at,
        updated_at
    )
    SELECT
        id,
        title,
        description,
        p_s3_path,
        owner_user_id,
        document_type_id,
        bundle_id,
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

-- Insert Default Values
INSERT INTO
    demos_app.phase_document_type
VALUES
    -- None phase currently allows all document types
    ('None', 'Application Completeness Letter'),
    ('None', 'Approval Letter'),
    ('None', 'Final BN Worksheet'),
    ('None', 'Final Budget Neutrality Formulation Workbook'),
    ('None', 'Formal OMB Policy Concurrence Email'),
    ('None', 'Internal Completeness Review Form'),
    ('None', 'Payment Ratio Analysis'),
    ('None', 'Pre-Submission'),
    ('None', 'Q&A'),
    ('None', 'Signed Decision Memo'),
    ('None', 'State Application'),
    ('None', 'General File'),

    -- General File is allowed for all phases
    ('Concept', 'General File'),
    ('State Application', 'General File'),
    ('Completeness', 'General File'),
    ('Federal Comment', 'General File'),
    ('SME/FRT', 'General File'),
    ('OGC & OMB', 'General File'),
    ('Approval Package', 'General File'),
    ('Post Approval', 'General File'),

    -- Now, add phase-specific documents
    ('Concept', 'Pre-Submission'),
    ('State Application', 'State Application'),
    ('Completeness', 'Internal Completeness Review Form'),
    ('Completeness', 'Application Completeness Letter'),
    ('Approval Package', 'Approval Letter'),
    ('Approval Package', 'Final BN Worksheet'),
    ('Approval Package', 'Final Budget Neutrality Formulation Workbook'),
    ('Approval Package', 'Formal OMB Policy Concurrence Email'),
    ('Approval Package', 'Payment Ratio Analysis'),
    ('Approval Package', 'Q&A'),
    ('Approval Package', 'Signed Decision Memo');
