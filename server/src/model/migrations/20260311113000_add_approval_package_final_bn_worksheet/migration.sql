INSERT INTO
    demos_app.phase_document_type (phase_id, document_type_id)
VALUES
    ('Approval Package', 'Final BN Worksheet')
ON CONFLICT (phase_id, document_type_id) DO NOTHING;
