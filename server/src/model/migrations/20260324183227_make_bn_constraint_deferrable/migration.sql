ALTER TABLE demos_app.budget_neutrality_workbook DROP CONSTRAINT budget_neutrality_workbook_id_document_type_id_fkey;
ALTER TABLE demos_app.budget_neutrality_workbook
ADD CONSTRAINT budget_neutrality_workbook_id_document_type_id_fkey
FOREIGN KEY (id, document_type_id)
REFERENCES demos_app.document(id, document_type_id)
ON DELETE NO ACTION
ON UPDATE CASCADE
DEFERRABLE INITIALLY DEFERRED;
