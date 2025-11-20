BEGIN;

UPDATE demos_app.phase
SET id='Review'
WHERE id='OGC & OMB Review';

UPDATE demos_app.phase_document_type
SET phase_id = 'Review'
WHERE phase_id = 'OGC & OMB Review';

UPDATE demos_app.date_type
SET id = 'Review Start Date'
WHERE id = 'OGC & OMB Review Start Date';

UPDATE demos_app.date_type
SET id = 'Review Completion Date'
WHERE id = 'OGC & OMB Review Completion Date';

UPDATE demos_app.phase_date_type 
SET phase_id = 'Review'
WHERE phase_id = 'OGC & OMB Review';

UPDATE demos_app.phase_date_type
SET date_type_id = 'Review Start Date'
WHERE date_type_id = 'OGC & OMB Review Start Date';

UPDATE demos_app.phase_date_type
SET date_type_id = 'Review Completion Date'
WHERE date_type_id = 'OGC & OMB Review Completion Date';

UPDATE demos_app.application_phase_type_limit
SET id = 'Review'
WHERE id = 'OGC & OMB Review';

commit;
