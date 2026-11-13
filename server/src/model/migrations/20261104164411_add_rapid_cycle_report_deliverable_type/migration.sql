INSERT INTO demos_app.deliverable_type (id) 
VALUES ('Rapid Cycle Report')
;

INSERT INTO demos_app.document_type (id)
VALUES ('Rapid Cycle Report')
;

INSERT INTO demos_app.deliverable_type_document_type (deliverable_type_id, document_type_id) 
VALUES 
  ('Rapid Cycle Report', 'General File'),
  ('Rapid Cycle Report', 'Rapid Cycle Report')
;
