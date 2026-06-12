UPDATE
  demos_app.date_type
SET 
  id = 'SME Initial Review Date'
WHERE
  id = 'SME Review Date'
;

UPDATE
  demos_app.date_type
SET
  id = 'Concept Paper Submitted Date'
WHERE
  id = 'Pre-Submission Submitted Date'
;