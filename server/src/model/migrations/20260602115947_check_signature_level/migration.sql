ALTER TABLE demos_app.demonstration
ADD CONSTRAINT demonstration_signature_level_check
CHECK (signature_level_id = 'OA');

ALTER TABLE demos_app.amendment
ADD CONSTRAINT amendment_signature_level_check
CHECK (signature_level_id IN ('OA', 'OCD'));

ALTER TABLE demos_app.extension
ADD CONSTRAINT extension_signature_level_check
CHECK (signature_level_id IN ('OA', 'OCD'));
