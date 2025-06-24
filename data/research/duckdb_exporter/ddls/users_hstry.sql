CREATE TABLE legacy_pmda_raw.users_hstry (
    hstry_id INTEGER,
    id INTEGER,
    username VARCHAR(256),
    firstname VARCHAR(32),
    lastname VARCHAR(64),
    deleted INTEGER,
    deleted_at TIMESTAMPTZ,
    remote INTEGER,
    phone VARCHAR(32),
    active INTEGER,
    lastaccess TIMESTAMPTZ,
    email VARCHAR(256),
    show_login_dshbd_ind SMALLINT,
    testing_user_ind SMALLINT,
    hstry_ts TIMESTAMPTZ
);
