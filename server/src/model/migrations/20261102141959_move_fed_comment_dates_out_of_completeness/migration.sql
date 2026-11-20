delete
from
	demos_app.phase_date_type
where
	phase_id = 'Completeness'
	and date_type_id in ('Federal Comment Period Start Date', 'Federal Comment Period End Date')
;
