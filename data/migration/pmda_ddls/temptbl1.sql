CREATE TABLE legacy_pmda_raw.temptbl1 (
    task_id INTEGER,
    title VARCHAR(255),
    start_date DATE,
    due_date DATE,
    status SMALLINT,
    priority SMALLINT,
    description TEXT,
    created_at TIMESTAMPTZ
);
