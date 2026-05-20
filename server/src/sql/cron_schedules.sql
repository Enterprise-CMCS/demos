-- Unschedule and reschedule all jobs every time
-- Prevents orphaned jobs
DO $$
DECLARE
    cronjob RECORD;
BEGIN
    FOR cronjob IN
        SELECT
            jobid
        FROM
            cron.job
    LOOP
        PERFORM cron.unschedule(cronjob.jobid);
    END LOOP;
END
$$;

-- nightly-update-federal-comment-phase-status
-- Scheduled to run at 00:05 Eastern
-- Time is in UTC, so during EDT will run at 23:05 and then 00:05
-- During EST, will run at 00:05 and then 01:05
SELECT cron.schedule(
    'nightly-update-federal-comment-phase-status',
    '5 4,5 * * *',
    'CALL demos_app.update_federal_comment_phase_status();'
);

-- nightly-mark-deliverables-past-due
-- Scheduled to run at 00:10 Eastern, same setup as above
SELECT cron.schedule(
    'nightly-mark-deliverables-past-due',
    '10 4,5 * * *',
    'CALL demos_app.mark_deliverables_as_past_due();'
);
