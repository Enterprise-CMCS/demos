-- Add "Federal Comment Internal Analysis Document" document type
INSERT INTO
    demos_app.document_type
VALUES
    ('Federal Comment Internal Analysis Document');

-- Allow this document type in the None phase (which permits all document types)
INSERT INTO
    demos_app.phase_document_type
VALUES
    ('None', 'Federal Comment Internal Analysis Document'),
    ('Federal Comment', 'Federal Comment Internal Analysis Document');
