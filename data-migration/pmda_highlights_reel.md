PMDA is workflow-centric, not table-centric. The useful map is `cma-site` for UI routes/actions and `cma-service` for the actual data workflows. In practice, the SQL summary should be based on the backend repositories, especially [cma-service/routes/web.php](cma-service/routes/web.php) and the repository classes under [cma-service/app/Repositories](cma-service/app/Repositories).

**Most Important Migration Workflows**
1. **Reference data first**
   Statuses, demo types, document types, roles, states, occurrence types, categories, reasons, and determination codes. PMDA logic depends heavily on numeric/code values, so do not blindly remap them without a crosswalk.

2. **Users, roles, and state access**
   Source: [DbUserRepository.php](cma-service/app/Repositories/DbUserRepository.php)
   Important tables include `users`, `user_role_asgnmt`, and `user_authrzd_state_acs`. Preserve inactive/deleted users too if they are referenced by demos, comments, deliverables, emails, or histories.

3. **Approved demonstrations**
   Source: [DbDemonstrationRepository.php](cma-service/app/Repositories/DbDemonstrationRepository.php)
   Core table is `mdcd_demo`. The important related data is status history, performance period history, comments, contacts, amendments, renewals/extensions, final decision info, site visits, post-award forums, and authority documents.

4. **Programs and demo types**
   Source: [DbProgramRepository.php](cma-service/app/Repositories/DbProgramRepository.php)
   Core table is `mdcd_pgm`, but demo-type details live in many type-specific tables. Views like `v_demo_mgmt_demo_types` are useful for identifying relationships, but the migration should still pull the underlying base rows.

5. **Waiver and expenditure authorities**
   These are part of the demo/program domain, not optional metadata. Important families include waiver authority tables, expenditure authority tables, not-applicable expenditure authority tables, and demo-link tables. Preserve expiration dates, deleted flags, and section/title/category relationships.

6. **Deliverables**
   Source: [DbDeliverableRepository.php](cma-service/app/Repositories/DbDeliverableRepository.php)
   Core table is `mdcd_dlvrbl`, but the real workflow includes status history, comments by origin, uploaded files, paper records, due-date-change requests, determinations, template links, BN/MRT flags, and processed-file flags. Migrating only deliverable rows would lose a lot of behavior.

7. **Application management / pending demos**
   Sources: [DbAppMgmtDemoRepository.php](cma-service/app/Repositories/DbAppMgmtDemoRepository.php), [DbAppMgmtProgramRepository.php](cma-service/app/Repositories/DbAppMgmtProgramRepository.php)
   This covers pending demos, applications, amendments/extensions, pending programs, application comments, federal decisions, and uploaded application documents. Pending application data is separate from approved-demo data and should be treated as its own migration area.

8. **Budget Neutrality**
   Source: [DbBudgetNeutralityRepository.php](cma-service/app/Repositories/DbBudgetNeutralityRepository.php)
   BN is file-backed plus parsed-data-backed. Important data includes template files, deliverable workbook files, parsed demo years, MEGs, populations, waivers, PMPM/cost data, warnings, totals, and division dashboard rows.

9. **Monitoring Reporting Tool**
   Source: [DbMonitoringReportingToolRepository.php](cma-service/app/Repositories/DbMonitoringReportingToolRepository.php)
   Similar to BN: uploaded templates/files plus parsed workbook/report/protocol data. Also uses demo-level MRT flags and start dates on `mdcd_demo`.

10. **STC documents**
   Source: [DbSTCRepository.php](cma-service/app/Repositories/DbSTCRepository.php)
   This is a document/search/cart workflow around Special Terms and Conditions. Migrate it if Demos needs STC search, generated docs, bookmarks, or cart history.

11. **Email, reports, help/support, admin**
   Sources: [DbEmailRepository.php](cma-service/app/Repositories/DbEmailRepository.php), [DbReportRepository.php](cma-service/app/Repositories/DbReportRepository.php)
   These may be archive-only depending on Demos scope. Email history has recipient tables. Help/support, FAQs, notification bars, params, and error logs are admin/reporting data.

The safest migration shape is:

1. Load reference/code tables. See *_rfrnc tables
2. Load users/roles/state access.
    ```sql
    SELECT
      rr.role_name,
      uasa.user_id,
      uasa.geo_ansi_state_cd,
      u.email,
      u.deleted_at
   FROM
      role_rfrnc rr
   JOIN user_role_asgnmt ura ON
      rr.role_cd = ura.role_cd
   JOIN users u ON
      ura.user_id = u.id
   JOIN user_authrzd_state_acs uasa ON
      ura.user_id = uasa.user_id
   WHERE u.deleted_at IS NULL order by rr.role_name;
   ```
3. Load approved demos and preserve original PMDA IDs or maintain explicit ID crosswalks.

    In PMDA, "approved demos" means the approved-demonstration side of the app: source rows from `mdcd_demo`. That is broader than only `mdcd_demo_stus_cd = 2`. Use `dltd_ind = 0` for the active migration scope; add `AND d.mdcd_demo_stus_cd = 2` only if the target should receive currently approved-only rows.

    ```sql
    -- PMDA/MySQL: active demonstration extract.
    -- This mirrors the main backend query in DbDemonstrationRepository::getDemoQuery().
    SELECT
      d.mdcd_demo_id AS pmda_mdcd_demo_id,
      d.mdcd_demo_num AS pmda_demo_number,
      d.mdcd_scndry_demo_num AS pmda_secondary_demo_number,
      d.mdcd_demo_name AS demo_name,
      d.mdcd_demo_desc AS demo_description,
      d.geo_ansi_state_cd AS state_code,
      s.geo_ansi_state_name AS state_name,
      d.mdcd_demo_stus_cd AS pmda_status_code,
      ds.mdcd_demo_stus_name AS pmda_status_name,
      d.demo_stus_dt AS pmda_status_date,
      d.state_prfmnc_yr_strt_dt AS effective_date,
      d.state_prfmnc_yr_end_dt AS expiration_date,
      d.rcvd_dt AS received_date,
      d.submsn_dt AS submitted_date,
      d.aprvl_dt AS approval_date,
      d.impltn_dt AS implementation_date,
      d.mdcd_chip_div_cd AS pmda_sdg_division_code,
      divs.mdcd_chip_div_name AS pmda_sdg_division_name,
      d.mdcd_demo_aplctn_sgntr_lvl_cd AS pmda_signature_level_code,
      sig.mdcd_demo_aplctn_sgntr_lvl_name AS pmda_signature_level_name,
      d.proj_ofcr_user_id,
      d.bkup_proj_ofcr_user_id,
      d.tchncl_drctr_user_id,
      d.mntrg_eval_tchncl_drctr_user_id,
      d.ro_mntrg_lead_user_id,
      d.ro_fincl_lead_user_id,
      d.anlyst_user_id,
      d.anlyst_scndry_user_id,
      d.state_prmry_poc_user_id,
      d.state_scndry_poc_user_id,
      d.state_3rd_poc_user_id,
      d.state_4th_poc_user_id,
      d.state_5th_poc_user_id,
      v.amndmt_cnt,
      v.rnwl_cnt,
      v.aprvl_desc,
      d.creatd_user_id AS pmda_created_user_id,
      d.creatd_dt AS created_at,
      d.updtd_user_id AS pmda_updated_user_id,
      d.updtd_dt AS updated_at
    FROM mdcd_demo d
    JOIN geo_ansi_state_rfrnc s
      ON s.geo_ansi_state_cd = d.geo_ansi_state_cd
    LEFT JOIN mdcd_demo_stus_rfrnc ds
      ON ds.mdcd_demo_stus_cd = d.mdcd_demo_stus_cd
    LEFT JOIN mdcd_chip_div_rfrnc divs
      ON divs.mdcd_chip_div_cd = d.mdcd_chip_div_cd
    LEFT JOIN mdcd_demo_aplctn_sgntr_lvl_rfrnc sig
      ON sig.mdcd_demo_aplctn_sgntr_lvl_cd = d.mdcd_demo_aplctn_sgntr_lvl_cd
    LEFT JOIN v_demo_status_dtl v
      ON v.mdcd_demo_id = d.mdcd_demo_id
    WHERE d.dltd_ind = 0
    ORDER BY d.geo_ansi_state_cd, d.mdcd_demo_num;
    ```

    ```sql
    -- PMDA/MySQL: keep the source status map visible before deciding target mappings.
    SELECT
      mdcd_demo_stus_cd,
      mdcd_demo_stus_name,
      dltd_ind
    FROM mdcd_demo_stus_rfrnc
    ORDER BY dsply_sqnc_num;
    ```

    Demos uses UUIDs for `demos_app.demonstration.id`, so do not try to insert PMDA's integer `mdcd_demo_id` as the target primary key. Create a crosswalk instead. Demos also generates `medicaid_id` and `chip_id` with triggers, so the PMDA demo number belongs in the migration crosswalk/audit data, not in those generated columns.

    ```sql
    -- Demos/Postgres: migration crosswalk.
    -- Use gen_random_uuid(); if the DB only has uuid-ossp, use uuid_generate_v4().
    CREATE TABLE IF NOT EXISTS migration_pmda_demo_xref (
      pmda_mdcd_demo_id integer PRIMARY KEY,
      demos_demonstration_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
      pmda_demo_number text,
      pmda_secondary_demo_number text,
      pmda_state_code text,
      migrated_at timestamptz DEFAULT CURRENT_TIMESTAMP
    );

    -- Assumes the PMDA extract above has been staged in Demos as migration_pmda_demo_source.
    INSERT INTO migration_pmda_demo_xref (
      pmda_mdcd_demo_id,
      pmda_demo_number,
      pmda_secondary_demo_number,
      pmda_state_code
    )
    SELECT
      src.pmda_mdcd_demo_id,
      src.pmda_demo_number,
      src.pmda_secondary_demo_number,
      src.state_code
    FROM migration_pmda_demo_source src
    ON CONFLICT (pmda_mdcd_demo_id) DO UPDATE
    SET
      pmda_demo_number = EXCLUDED.pmda_demo_number,
      pmda_secondary_demo_number = EXCLUDED.pmda_secondary_demo_number,
      pmda_state_code = EXCLUDED.pmda_state_code;
    ```

    ```sql
    -- Demos/Postgres: explicit PMDA-to-Demos lookup maps.
    -- These are examples; run the status lookup above and confirm business mapping.
    CREATE TABLE IF NOT EXISTS migration_pmda_demo_status_map (
      pmda_status_code integer PRIMARY KEY,
      demos_status_id text NOT NULL REFERENCES demos_app.application_status(id)
    );

    INSERT INTO migration_pmda_demo_status_map VALUES
      (2, 'Approved'),
      (9, 'Withdrawn')
    ON CONFLICT (pmda_status_code) DO UPDATE
    SET demos_status_id = EXCLUDED.demos_status_id;

    CREATE TABLE IF NOT EXISTS migration_pmda_sdg_division_map (
      pmda_sdg_division_code integer PRIMARY KEY,
      demos_sdg_division_id text NOT NULL REFERENCES demos_app.sdg_division(id)
    );

    INSERT INTO migration_pmda_sdg_division_map VALUES
      (2, 'Division of System Reform Demonstrations'),
      (3, 'Division of Eligibility and Coverage Demonstrations')
    ON CONFLICT (pmda_sdg_division_code) DO UPDATE
    SET demos_sdg_division_id = EXCLUDED.demos_sdg_division_id;

    CREATE TABLE IF NOT EXISTS migration_pmda_signature_level_map (
      pmda_signature_level_code integer PRIMARY KEY,
      demos_signature_level_id text REFERENCES demos_app.signature_level(id)
    );

    INSERT INTO migration_pmda_signature_level_map VALUES
      (0, NULL),
      (1, 'OA'),
      (2, 'OCD'),
      (3, 'OGD')
    ON CONFLICT (pmda_signature_level_code) DO UPDATE
    SET demos_signature_level_id = EXCLUDED.demos_signature_level_id;
    ```

    ```sql
    -- Demos/Postgres: report rows that need mapping/data fixes before insert.
    -- Prefer reporting these rows instead of defaulting values that may be wrong.
    SELECT
      src.pmda_mdcd_demo_id,
      src.pmda_demo_number,
      src.demo_name,
      src.pmda_status_code,
      src.pmda_status_name,
      src.pmda_sdg_division_code,
      src.pmda_signature_level_code,
      CASE WHEN st.id IS NULL THEN 'Missing state in Demos' END AS state_error,
      CASE WHEN sm.demos_status_id IS NULL THEN 'Missing status map' END AS status_error,
      CASE WHEN dm.demos_sdg_division_id IS NULL THEN 'Missing SDG division map' END AS division_error,
      CASE WHEN lm.pmda_signature_level_code IS NULL THEN 'Missing signature map' END AS signature_error,
      CASE WHEN nullif(trim(src.demo_name), '') IS NULL THEN 'Missing demo name' END AS name_error,
      CASE
        WHEN sm.demos_status_id = 'Approved'
          AND (
            src.effective_date IS NULL
            OR src.expiration_date IS NULL
            OR dm.demos_sdg_division_id IS NULL
            OR lm.demos_signature_level_id IS NULL
          )
        THEN 'Approved demo would fail Demos required-field check'
      END AS approved_demo_error
    FROM migration_pmda_demo_source src
    LEFT JOIN demos_app.state st
      ON st.id = src.state_code
    LEFT JOIN migration_pmda_demo_status_map sm
      ON sm.pmda_status_code = src.pmda_status_code
    LEFT JOIN migration_pmda_sdg_division_map dm
      ON dm.pmda_sdg_division_code = src.pmda_sdg_division_code
    LEFT JOIN migration_pmda_signature_level_map lm
      ON lm.pmda_signature_level_code = src.pmda_signature_level_code
    WHERE st.id IS NULL
      OR sm.demos_status_id IS NULL
      OR dm.demos_sdg_division_id IS NULL
      OR lm.pmda_signature_level_code IS NULL
      OR nullif(trim(src.demo_name), '') IS NULL
      OR (
        sm.demos_status_id = 'Approved'
        AND (
          src.effective_date IS NULL
          OR src.expiration_date IS NULL
          OR dm.demos_sdg_division_id IS NULL
          OR lm.demos_signature_level_id IS NULL
        )
      );
    ```

    ```sql
    -- Demos/Postgres: insert application shell rows first.
    -- demonstration.id has an FK to application.id with the same application_type_id.
    INSERT INTO demos_app.application (
      id,
      application_type_id
    )
    SELECT
      x.demos_demonstration_id,
      'Demonstration'
    FROM migration_pmda_demo_xref x
    ON CONFLICT (id) DO NOTHING;

    -- Demos/Postgres: insert demonstration rows.
    -- current_phase_id = 'Approval Summary' is a reasonable migrated-approved-demo default,
    -- but confirm it with the Demos workflow owner.
    INSERT INTO demos_app.demonstration (
      id,
      application_type_id,
      name,
      description,
      effective_date,
      expiration_date,
      sdg_division_id,
      signature_level_id,
      status_id,
      status_updated_at,
      current_phase_id,
      state_id,
      clearance_level_id,
      created_at,
      updated_at
    )
    SELECT
      x.demos_demonstration_id,
      'Demonstration',
      trim(src.demo_name),
      nullif(trim(src.demo_description), ''),
      src.effective_date::timestamptz,
      src.expiration_date::timestamptz,
      dm.demos_sdg_division_id,
      lm.demos_signature_level_id,
      sm.demos_status_id,
      COALESCE(src.pmda_status_date::timestamptz, src.updated_at, src.created_at, CURRENT_TIMESTAMP),
      'Approval Summary',
      st.id,
      'CMS (OSORA)',
      COALESCE(src.created_at, CURRENT_TIMESTAMP),
      COALESCE(src.updated_at, src.created_at, CURRENT_TIMESTAMP)
    FROM migration_pmda_demo_source src
    JOIN migration_pmda_demo_xref x
      ON x.pmda_mdcd_demo_id = src.pmda_mdcd_demo_id
    JOIN demos_app.state st
      ON st.id = src.state_code
    JOIN migration_pmda_demo_status_map sm
      ON sm.pmda_status_code = src.pmda_status_code
    JOIN migration_pmda_sdg_division_map dm
      ON dm.pmda_sdg_division_code = src.pmda_sdg_division_code
    JOIN migration_pmda_signature_level_map lm
      ON lm.pmda_signature_level_code = src.pmda_signature_level_code
    ON CONFLICT (id) DO UPDATE
    SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      effective_date = EXCLUDED.effective_date,
      expiration_date = EXCLUDED.expiration_date,
      sdg_division_id = EXCLUDED.sdg_division_id,
      signature_level_id = EXCLUDED.signature_level_id,
      status_id = EXCLUDED.status_id,
      status_updated_at = EXCLUDED.status_updated_at,
      current_phase_id = EXCLUDED.current_phase_id,
      updated_at = EXCLUDED.updated_at;
    ```

    ```sql
    -- Demos/Postgres: reconcile source rows to target rows.
    SELECT
      COUNT(*) AS source_demo_count,
      COUNT(d.id) AS migrated_demo_count,
      COUNT(*) - COUNT(d.id) AS missing_demo_count
    FROM migration_pmda_demo_xref x
    LEFT JOIN demos_app.demonstration d
      ON d.id = x.demos_demonstration_id;

    SELECT
      x.pmda_state_code,
      COUNT(*) AS source_demo_count,
      COUNT(d.id) AS migrated_demo_count
    FROM migration_pmda_demo_xref x
    LEFT JOIN demos_app.demonstration d
      ON d.id = x.demos_demonstration_id
    GROUP BY x.pmda_state_code
    ORDER BY x.pmda_state_code;
    ```
4. Load demo child data: contacts, comments, statuses, dates, authorities, files, site visits, PAFs.

    For demo child data, the key rule is: every extracted row should carry `pmda_mdcd_demo_id`, and every target-side load should join through `migration_pmda_demo_xref`. Do not join child data by state/name/demo number once the crosswalk exists.

    ```sql
    -- PMDA/MySQL: user-based demo contacts stored directly on mdcd_demo.
    -- This is the best starting point for Demos demonstration_role_assignment mapping.
    SELECT d.mdcd_demo_id AS pmda_mdcd_demo_id, 'proj_ofcr_user_id' AS pmda_contact_slot, 'Project Officer' AS suggested_demos_role, d.proj_ofcr_user_id AS pmda_user_id
    FROM mdcd_demo d WHERE d.dltd_ind = 0 AND d.proj_ofcr_user_id IS NOT NULL
    UNION ALL
    SELECT d.mdcd_demo_id, 'bkup_proj_ofcr_user_id', 'Project Officer', d.bkup_proj_ofcr_user_id
    FROM mdcd_demo d WHERE d.dltd_ind = 0 AND d.bkup_proj_ofcr_user_id IS NOT NULL AND d.bkup_proj_ofcr_user_id <> 0
    UNION ALL
    SELECT d.mdcd_demo_id, 'tchncl_drctr_user_id', 'Policy Technical Director', d.tchncl_drctr_user_id
    FROM mdcd_demo d WHERE d.dltd_ind = 0 AND d.tchncl_drctr_user_id IS NOT NULL
    UNION ALL
    SELECT d.mdcd_demo_id, 'mntrg_eval_tchncl_drctr_user_id', 'Monitoring & Evaluation Technical Director', d.mntrg_eval_tchncl_drctr_user_id
    FROM mdcd_demo d WHERE d.dltd_ind = 0 AND d.mntrg_eval_tchncl_drctr_user_id IS NOT NULL
    UNION ALL
    SELECT d.mdcd_demo_id, 'anlyst_user_id', 'DDME Analyst', d.anlyst_user_id
    FROM mdcd_demo d WHERE d.dltd_ind = 0 AND d.anlyst_user_id IS NOT NULL
    UNION ALL
    SELECT d.mdcd_demo_id, 'anlyst_scndry_user_id', 'DDME Analyst', d.anlyst_scndry_user_id
    FROM mdcd_demo d WHERE d.dltd_ind = 0 AND d.anlyst_scndry_user_id IS NOT NULL
    UNION ALL
    SELECT d.mdcd_demo_id, 'state_prmry_poc_user_id', 'State Point of Contact', d.state_prmry_poc_user_id
    FROM mdcd_demo d WHERE d.dltd_ind = 0 AND d.state_prmry_poc_user_id IS NOT NULL
    UNION ALL
    SELECT d.mdcd_demo_id, 'state_scndry_poc_user_id', 'State Point of Contact', d.state_scndry_poc_user_id
    FROM mdcd_demo d WHERE d.dltd_ind = 0 AND d.state_scndry_poc_user_id IS NOT NULL
    UNION ALL
    SELECT d.mdcd_demo_id, 'state_3rd_poc_user_id', 'State Point of Contact', d.state_3rd_poc_user_id
    FROM mdcd_demo d WHERE d.dltd_ind = 0 AND d.state_3rd_poc_user_id IS NOT NULL
    UNION ALL
    SELECT d.mdcd_demo_id, 'state_4th_poc_user_id', 'State Point of Contact', d.state_4th_poc_user_id
    FROM mdcd_demo d WHERE d.dltd_ind = 0 AND d.state_4th_poc_user_id IS NOT NULL
    UNION ALL
    SELECT d.mdcd_demo_id, 'state_5th_poc_user_id', 'State Point of Contact', d.state_5th_poc_user_id
    FROM mdcd_demo d WHERE d.dltd_ind = 0 AND d.state_5th_poc_user_id IS NOT NULL
    ORDER BY pmda_mdcd_demo_id, suggested_demos_role, pmda_contact_slot;
    ```

    ```sql
    -- PMDA/MySQL: non-user contact detail.
    -- These are not role assignments; treat them as contact/reference data.
    SELECT
      c.*
    FROM mdcd_demo_cntct c
    JOIN mdcd_demo d
      ON d.mdcd_demo_id = c.mdcd_demo_id
    WHERE d.dltd_ind = 0
    ORDER BY c.mdcd_demo_id;
    ```

    ```sql
    -- PMDA/MySQL: demo comments, status history, and performance-period history.
    SELECT
      c.mdcd_demo_cmt_id,
      c.mdcd_demo_id AS pmda_mdcd_demo_id,
      c.proj_ofcr_user_id AS pmda_user_id,
      c.cmt_txt,
      c.creatd_dt
    FROM mdcd_demo_cmt c
    JOIN mdcd_demo d
      ON d.mdcd_demo_id = c.mdcd_demo_id
    WHERE d.dltd_ind = 0
    ORDER BY c.mdcd_demo_id, c.creatd_dt;

    SELECT
      h.mdcd_demo_stus_hstry_id,
      h.mdcd_demo_id AS pmda_mdcd_demo_id,
      h.mdcd_demo_stus_cd AS pmda_status_code,
      s.mdcd_demo_stus_name AS pmda_status_name,
      h.mdcd_demo_stus_dt,
      h.creatd_dt
    FROM mdcd_demo_stus_hstry h
    JOIN mdcd_demo d
      ON d.mdcd_demo_id = h.mdcd_demo_id
    LEFT JOIN mdcd_demo_stus_rfrnc s
      ON s.mdcd_demo_stus_cd = h.mdcd_demo_stus_cd
    WHERE d.dltd_ind = 0
    ORDER BY h.mdcd_demo_id, h.creatd_dt;

    SELECT
      h.mdcd_demo_prfmnc_dt_hstry_id,
      h.mdcd_demo_id AS pmda_mdcd_demo_id,
      h.state_prfmnc_yr_strt_dt,
      h.state_prfmnc_yr_end_dt,
      h.creatd_dt
    FROM mdcd_demo_prfmnc_dt_hstry h
    JOIN mdcd_demo d
      ON d.mdcd_demo_id = h.mdcd_demo_id
    WHERE d.dltd_ind = 0
    ORDER BY h.mdcd_demo_id, h.creatd_dt;
    ```

    ```sql
    -- PMDA/MySQL: structured waiver and expenditure authorities.
    -- Preserve source IDs; section/cap rows depend on these parent IDs.
    SELECT a.*
    FROM mdcd_demo_wvr_authrty a
    JOIN mdcd_demo d ON d.mdcd_demo_id = a.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND a.dltd_ind = 0
    ORDER BY a.mdcd_demo_id, a.mdcd_demo_wvr_authrty_id;

    SELECT s.*
    FROM mdcd_demo_wvr_authrty_sect s
    JOIN mdcd_demo_wvr_authrty a
      ON a.mdcd_demo_wvr_authrty_id = s.mdcd_demo_wvr_authrty_id
    JOIN mdcd_demo d
      ON d.mdcd_demo_id = a.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND a.dltd_ind = 0 AND s.dltd_ind = 0
    ORDER BY a.mdcd_demo_id, s.mdcd_demo_wvr_authrty_id, s.demo_wvr_sect_sqnc_num;

    SELECT e.*
    FROM mdcd_demo_expndtr_authrty e
    JOIN mdcd_demo d ON d.mdcd_demo_id = e.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND e.dltd_ind = 0
    ORDER BY e.mdcd_demo_id, e.mdcd_demo_expndtr_authrty_id;

    SELECT cap.*
    FROM mdcd_demo_expndtr_authrty_cap cap
    JOIN mdcd_demo d ON d.mdcd_demo_id = cap.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND cap.dltd_ind = 0
    ORDER BY cap.mdcd_demo_id, cap.mdcd_demo_expndtr_authrty_cap_id;

    SELECT link.*
    FROM mdcd_demo_expndtr_authrty_cap_link link
    JOIN mdcd_demo d ON d.mdcd_demo_id = link.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND link.dltd_ind = 0
    ORDER BY link.mdcd_demo_id, link.mdcd_demo_expndtr_authrty_cap_id, link.mdcd_demo_expndtr_authrty_id;

    SELECT na.*
    FROM mdcd_demo_na_expndtr_authrty na
    JOIN mdcd_demo d ON d.mdcd_demo_id = na.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND na.dltd_ind = 0
    ORDER BY na.mdcd_demo_id, na.mdcd_demo_na_expndtr_authrty_id;

    SELECT nas.*
    FROM mdcd_demo_na_expndtr_authrty_sect nas
    JOIN mdcd_demo_na_expndtr_authrty na
      ON na.mdcd_demo_na_expndtr_authrty_id = nas.mdcd_demo_na_expndtr_authrty_id
    JOIN mdcd_demo d
      ON d.mdcd_demo_id = na.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND na.dltd_ind = 0 AND nas.dltd_ind = 0
    ORDER BY na.mdcd_demo_id, nas.mdcd_demo_na_expndtr_authrty_id, nas.demo_na_expndtr_sect_sqnc_num;
    ```

    ```sql
    -- PMDA/MySQL: demo-level file metadata.
    -- These queries do not copy files; they identify file metadata and stored filenames.
    SELECT f.*
    FROM mdcd_demo_authrty_fil_doc f
    JOIN mdcd_demo d ON d.mdcd_demo_id = f.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND f.dltd_ind = 0
    ORDER BY f.mdcd_demo_id, f.creatd_dt;

    SELECT f.*
    FROM mdcd_demo_finl_dcsn_dtl_fil_doc f
    JOIN mdcd_demo d ON d.mdcd_demo_id = f.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND f.dltd_ind = 0
    ORDER BY f.mdcd_demo_id, f.creatd_dt;

    SELECT c.*
    FROM mdcd_demo_finl_dcsn_dtl_cmt c
    JOIN mdcd_demo d ON d.mdcd_demo_id = c.mdcd_demo_id
    WHERE d.dltd_ind = 0
    ORDER BY c.mdcd_demo_id, c.creatd_dt;

    SELECT doc.*
    FROM mdcd_demo_pgm_mntrg_doc doc
    JOIN mdcd_demo d ON d.mdcd_demo_id = doc.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND doc.dltd_ind = 0
    ORDER BY doc.mdcd_demo_id, doc.pgm_mntrg_doc_call_dt, doc.creatd_dt;

    SELECT c.*
    FROM mdcd_demo_pgm_mntrg_doc_cmt c
    JOIN mdcd_demo_pgm_mntrg_doc doc
      ON doc.mdcd_demo_pgm_mntrg_doc_id = c.mdcd_demo_pgm_mntrg_doc_id
    JOIN mdcd_demo d
      ON d.mdcd_demo_id = doc.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND doc.dltd_ind = 0
    ORDER BY doc.mdcd_demo_id, c.mdcd_demo_pgm_mntrg_doc_id, c.creatd_dt;
    ```

    ```sql
    -- PMDA/MySQL: site visits, attendees, and site-visit files.
    SELECT sv.*
    FROM mdcd_demo_sv sv
    JOIN mdcd_demo d ON d.mdcd_demo_id = sv.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND sv.dltd_ind = 0
    ORDER BY sv.mdcd_demo_id, sv.demo_sv_dt;

    SELECT a.*
    FROM mdcd_demo_sv_atnde a
    JOIN mdcd_demo_sv sv ON sv.mdcd_demo_sv_id = a.mdcd_demo_sv_id
    JOIN mdcd_demo d ON d.mdcd_demo_id = sv.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND sv.dltd_ind = 0 AND a.dltd_ind = 0
    ORDER BY sv.mdcd_demo_id, a.mdcd_demo_sv_id, a.creatd_dt;

    SELECT f.*
    FROM mdcd_demo_sv_fil_doc f
    JOIN mdcd_demo_sv sv ON sv.mdcd_demo_sv_id = f.mdcd_demo_sv_id
    JOIN mdcd_demo d ON d.mdcd_demo_id = sv.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND sv.dltd_ind = 0 AND f.dltd_ind = 0
    ORDER BY sv.mdcd_demo_id, f.mdcd_demo_sv_id, f.creatd_dt;
    ```

    ```sql
    -- PMDA/MySQL: post-award forum rows, files, and status history.
    SELECT paf.*
    FROM mdcd_pst_awd_frm paf
    JOIN mdcd_demo d ON d.mdcd_demo_id = paf.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND paf.dltd_ind = 0
    ORDER BY paf.mdcd_demo_id, paf.pst_awd_frm_due_dt;

    SELECT f.*
    FROM mdcd_pst_awd_frm_fil_doc f
    JOIN mdcd_pst_awd_frm paf
      ON paf.mdcd_pst_awd_frm_id = f.mdcd_pst_awd_frm_id
    JOIN mdcd_demo d
      ON d.mdcd_demo_id = paf.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND paf.dltd_ind = 0 AND f.dltd_ind = 0
    ORDER BY paf.mdcd_demo_id, f.mdcd_pst_awd_frm_id, f.creatd_dt;

    SELECT h.*
    FROM mdcd_pst_awd_frm_stus_hstry h
    JOIN mdcd_pst_awd_frm paf
      ON paf.mdcd_pst_awd_frm_id = h.mdcd_pst_awd_frm_id
    JOIN mdcd_demo d
      ON d.mdcd_demo_id = paf.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND paf.dltd_ind = 0
    ORDER BY paf.mdcd_demo_id, h.mdcd_pst_awd_frm_id, h.creatd_dt;
    ```

    ```sql
    -- Demos/Postgres: target-side pattern after staging any child extract.
    -- Example shown for comments. Use the same xref join for every child table.
    SELECT
      x.demos_demonstration_id,
      c.*
    FROM migration_pmda_demo_comment_source c
    JOIN migration_pmda_demo_xref x
      ON x.pmda_mdcd_demo_id = c.pmda_mdcd_demo_id;

    -- Reconciliation example: child rows that cannot find a migrated parent demo.
    SELECT
      c.pmda_mdcd_demo_id,
      COUNT(*) AS orphan_comment_count
    FROM migration_pmda_demo_comment_source c
    LEFT JOIN migration_pmda_demo_xref x
      ON x.pmda_mdcd_demo_id = c.pmda_mdcd_demo_id
    WHERE x.pmda_mdcd_demo_id IS NULL
    GROUP BY c.pmda_mdcd_demo_id
    ORDER BY c.pmda_mdcd_demo_id;
    ```
5. Load programs and demo-type-specific details.

    Programs are the parent rows in `mdcd_pgm`. Demo types are not stored in one table; PMDA spreads them across many `mdcd_*_pgm_dtl` tables and normalizes them for the UI with `v_demo_mgmt_demo_types`. Use the view for coverage/reconciliation, but keep the underlying detail-table rows if Demos needs full source fidelity.

    ```sql
    -- PMDA/MySQL: core programs for migrated demos.
    SELECT
      p.mdcd_pgm_id AS pmda_mdcd_pgm_id,
      p.mdcd_demo_id AS pmda_mdcd_demo_id,
      p.pgm_cd,
      p.pgm_name,
      p.pgm_desc,
      p.prfmnc_prd_from_dt,
      p.prfmnc_prd_to_dt,
      p.creatd_dt
    FROM mdcd_pgm p
    JOIN mdcd_demo d
      ON d.mdcd_demo_id = p.mdcd_demo_id
    WHERE d.dltd_ind = 0
      AND p.dltd_ind = 0
    ORDER BY p.mdcd_demo_id, p.pgm_name, p.mdcd_pgm_id;

    SELECT
      c.mdcd_pgm_cmt_id,
      c.mdcd_demo_id AS pmda_mdcd_demo_id,
      c.mdcd_pgm_id AS pmda_mdcd_pgm_id,
      c.mdcd_demo_type_name,
      c.cmt_txt,
      c.user_id AS pmda_user_id,
      c.creatd_dt
    FROM mdcd_pgm_cmt c
    JOIN mdcd_pgm p
      ON p.mdcd_pgm_id = c.mdcd_pgm_id
    JOIN mdcd_demo d
      ON d.mdcd_demo_id = p.mdcd_demo_id
    WHERE d.dltd_ind = 0
      AND p.dltd_ind = 0
    ORDER BY c.mdcd_demo_id, c.mdcd_pgm_id, c.creatd_dt;
    ```

    ```sql
    -- PMDA/MySQL: demo-type rollup used by the backend/UI.
    -- name = PMDA demo type code; id = source detail-table row id for that type.
    SELECT
      v.mdcd_demo_id AS pmda_mdcd_demo_id,
      v.mdcd_pgm_id AS pmda_mdcd_pgm_id,
      v.name AS pmda_demo_type_code,
      r.mdcd_demo_type_name,
      v.title,
      v.detailed_name,
      v.id AS pmda_demo_type_detail_id,
      v.from_dt,
      v.to_dt,
      v.mdcd_pymt_ratio_ind
    FROM v_demo_mgmt_demo_types v
    JOIN mdcd_pgm p
      ON p.mdcd_pgm_id = v.mdcd_pgm_id
    JOIN mdcd_demo d
      ON d.mdcd_demo_id = v.mdcd_demo_id
    LEFT JOIN mdcd_demo_type_rfrnc r
      ON r.mdcd_demo_type_cd = v.name
    WHERE d.dltd_ind = 0
      AND p.dltd_ind = 0
    ORDER BY v.mdcd_demo_id, v.mdcd_pgm_id, r.dsply_sqnc_num, v.detailed_name;
    ```

    ```sql
    -- PMDA/MySQL: find the physical program-detail tables that need extraction.
    -- These are the base tables behind v_demo_mgmt_demo_types.
    SELECT
      table_name
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND column_name = 'mdcd_pgm_id'
      AND table_name LIKE 'mdcd\\_%\\_pgm\\_dtl' ESCAPE '\\'
    ORDER BY table_name;
    ```

    ```sql
    -- PMDA/MySQL: examples of common detail-table extracts.
    -- Repeat this pattern for every table returned by the information_schema query.
    SELECT
      'SUD' AS pmda_demo_type_code,
      sud.mdcd_sud_pgm_dtl_id AS pmda_demo_type_detail_id,
      sud.mdcd_demo_id AS pmda_mdcd_demo_id,
      sud.mdcd_pgm_id AS pmda_mdcd_pgm_id,
      sud.from_dt,
      sud.to_dt,
      sud.creatd_dt
    FROM mdcd_sud_pgm_dtl sud
    JOIN mdcd_pgm p ON p.mdcd_pgm_id = sud.mdcd_pgm_id
    JOIN mdcd_demo d ON d.mdcd_demo_id = sud.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND p.dltd_ind = 0 AND sud.dltd_ind = 0
    UNION ALL
    SELECT
      'MC',
      mc.mdcd_mc_pgm_dtl_id,
      mc.mdcd_demo_id,
      mc.mdcd_pgm_id,
      mc.from_dt,
      mc.to_dt,
      mc.creatd_dt
    FROM mdcd_mc_pgm_dtl mc
    JOIN mdcd_pgm p ON p.mdcd_pgm_id = mc.mdcd_pgm_id
    JOIN mdcd_demo d ON d.mdcd_demo_id = mc.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND p.dltd_ind = 0 AND mc.dltd_ind = 0
    UNION ALL
    SELECT
      'LTSS',
      ltss.mdcd_ltss_pgm_dtl_id,
      ltss.mdcd_demo_id,
      ltss.mdcd_pgm_id,
      ltss.from_dt,
      ltss.to_dt,
      ltss.creatd_dt
    FROM mdcd_ltss_pgm_dtl ltss
    JOIN mdcd_pgm p ON p.mdcd_pgm_id = ltss.mdcd_pgm_id
    JOIN mdcd_demo d ON d.mdcd_demo_id = ltss.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND p.dltd_ind = 0 AND ltss.dltd_ind = 0
    UNION ALL
    SELECT
      'HRSN',
      hrsn.mdcd_hlth_rltd_scl_nds_pgm_dtl_id,
      hrsn.mdcd_demo_id,
      hrsn.mdcd_pgm_id,
      hrsn.from_dt,
      hrsn.to_dt,
      hrsn.creatd_dt
    FROM mdcd_hlth_rltd_scl_nds_pgm_dtl hrsn
    JOIN mdcd_pgm p ON p.mdcd_pgm_id = hrsn.mdcd_pgm_id
    JOIN mdcd_demo d ON d.mdcd_demo_id = hrsn.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND p.dltd_ind = 0 AND hrsn.dltd_ind = 0
    ORDER BY pmda_mdcd_demo_id, pmda_mdcd_pgm_id, pmda_demo_type_code;
    ```

    ```sql
    -- PMDA/MySQL: beneficiary, exempt group, and cost-sharing data by program/detail row.
    SELECT bg.*
    FROM bene_grp bg
    JOIN mdcd_pgm p ON p.mdcd_pgm_id = bg.mdcd_pgm_id
    JOIN mdcd_demo d ON d.mdcd_demo_id = bg.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND p.dltd_ind = 0 AND bg.dltd_ind = 0
    ORDER BY bg.mdcd_demo_id, bg.mdcd_pgm_id, bg.demo_type_cd, bg.mdcd_pgm_dtl_id, bg.bene_grp_id;

    SELECT ex.*
    FROM bene_exmpt_grp ex
    JOIN mdcd_pgm p ON p.mdcd_pgm_id = ex.mdcd_pgm_id
    JOIN mdcd_demo d ON d.mdcd_demo_id = ex.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND p.dltd_ind = 0 AND ex.dltd_ind = 0
    ORDER BY ex.mdcd_demo_id, ex.mdcd_pgm_id, ex.demo_type_cd, ex.mdcd_pgm_dtl_id, ex.bene_exmpt_grp_id;

    SELECT cs.*
    FROM bene_cst_shrng cs
    JOIN bene_grp bg ON bg.bene_grp_id = cs.bene_grp_id
    JOIN mdcd_pgm p ON p.mdcd_pgm_id = cs.mdcd_pgm_id
    JOIN mdcd_demo d ON d.mdcd_demo_id = cs.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND p.dltd_ind = 0 AND bg.dltd_ind = 0 AND cs.dltd_ind = 0
    ORDER BY cs.mdcd_demo_id, cs.mdcd_pgm_id, cs.demo_type_cd, cs.mdcd_pgm_dtl_id, cs.bene_cst_shrng_id;

    SELECT w.*
    FROM bene_grp_asctd_wvr w
    JOIN bene_grp bg ON bg.bene_grp_id = w.bene_grp_id
    JOIN mdcd_demo d ON d.mdcd_demo_id = bg.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND bg.dltd_ind = 0 AND w.dltd_ind = 0
    ORDER BY bg.mdcd_demo_id, bg.mdcd_pgm_id, bg.bene_grp_id;

    SELECT ea.*
    FROM bene_grp_asctd_expndtr_authrty ea
    JOIN bene_grp bg ON bg.bene_grp_id = ea.bene_grp_id
    JOIN mdcd_demo d ON d.mdcd_demo_id = bg.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND bg.dltd_ind = 0 AND ea.dltd_ind = 0
    ORDER BY bg.mdcd_demo_id, bg.mdcd_pgm_id, bg.bene_grp_id;

    SELECT svc.*
    FROM bene_cst_shrng_srvc_asctn svc
    JOIN bene_cst_shrng cs ON cs.bene_cst_shrng_id = svc.bene_cst_shrng_id
    JOIN mdcd_demo d ON d.mdcd_demo_id = cs.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND cs.dltd_ind = 0 AND svc.dltd_ind = 0
    ORDER BY cs.mdcd_demo_id, cs.mdcd_pgm_id, cs.bene_cst_shrng_id;
    ```

    ```sql
    -- Demos/Postgres: target-side pattern after staging programs.
    -- Keep both demo and program xrefs; many later rows point to mdcd_pgm_id.
    CREATE TABLE IF NOT EXISTS migration_pmda_program_xref (
      pmda_mdcd_pgm_id integer PRIMARY KEY,
      pmda_mdcd_demo_id integer NOT NULL,
      demos_demonstration_id uuid NOT NULL REFERENCES demos_app.demonstration(id),
      pmda_program_code text,
      pmda_program_name text,
      migrated_at timestamptz DEFAULT CURRENT_TIMESTAMP
    );

    INSERT INTO migration_pmda_program_xref (
      pmda_mdcd_pgm_id,
      pmda_mdcd_demo_id,
      demos_demonstration_id,
      pmda_program_code,
      pmda_program_name
    )
    SELECT
      p.pmda_mdcd_pgm_id,
      p.pmda_mdcd_demo_id,
      x.demos_demonstration_id,
      p.pgm_cd,
      p.pgm_name
    FROM migration_pmda_program_source p
    JOIN migration_pmda_demo_xref x
      ON x.pmda_mdcd_demo_id = p.pmda_mdcd_demo_id
    ON CONFLICT (pmda_mdcd_pgm_id) DO UPDATE
    SET
      demos_demonstration_id = EXCLUDED.demos_demonstration_id,
      pmda_program_code = EXCLUDED.pmda_program_code,
      pmda_program_name = EXCLUDED.pmda_program_name;
    ```
6. Load deliverables with their statuses, comments, files, due-date requests, and history.

    Deliverables are one of the highest-risk migration areas. `mdcd_dlvrbl` is only the parent row. Status history, comments, uploaded files, BN/MRT flags, due-date-change requests, and paper records all affect what users see.

    ```sql
    -- PMDA/MySQL: status/type reference maps for deliverables.
    SELECT
      mdcd_dlvrbl_stus_cd,
      mdcd_dlvrbl_stus_name,
      dsply_sqnc_num
    FROM mdcd_dlvrbl_stus_rfrnc
    ORDER BY dsply_sqnc_num;

    SELECT
      mdcd_dlvrbl_rpt_ocrnc_cd,
      mdcd_dlvrbl_rpt_ocrnc_name,
      mdcd_dlvrbl_rpt_ocrnc_num,
      aprvd_wrkflw_ind,
      dltd_ind
    FROM mdcd_dlvrbl_rpt_ocrnc_rfrnc
    ORDER BY dsply_sqnc_num, mdcd_dlvrbl_rpt_ocrnc_name;
    ```

    ```sql
    -- PMDA/MySQL: core deliverables for migrated demos.
    SELECT
      dlv.mdcd_dlvrbl_id AS pmda_mdcd_dlvrbl_id,
      dlv.mdcd_demo_id AS pmda_mdcd_demo_id,
      dlv.mdcd_dlvrbl_type_cd AS pmda_deliverable_type_code,
      typ.mdcd_dlvrbl_rpt_ocrnc_name AS pmda_deliverable_type_name,
      dlv.mdcd_dlvrbl_name,
      dlv.mdcd_dlvrbl_optnl_name,
      dlv.mdcd_dlvrbl_desc,
      dlv.mdcd_demo_type_cd,
      dlv.mdcd_dlvrbl_crnt_stus_cd AS pmda_status_code,
      st.mdcd_dlvrbl_stus_name AS pmda_status_name,
      dlv.dlvrbl_due_dt,
      dlv.mdcd_dlvrbl_prvs_due_dt,
      dlv.last_rcvd_dt,
      dlv.dlvrbl_stus_updt_dt,
      dlv.mdcd_dlvrbl_open_endd_ind,
      dlv.mdcd_dlvrbl_open_endd_days_num,
      dlv.bdgt_ntrlty_ind,
      dlv.bdgt_ntrlty_ovrrdn_ind,
      dlv.publg_dt,
      dlv.publg_cmt_txt,
      dlv.creatd_user_id AS pmda_created_user_id,
      dlv.creatd_dt AS created_at,
      dlv.updtd_user_id AS pmda_updated_user_id,
      dlv.updtd_dt AS updated_at
    FROM mdcd_dlvrbl dlv
    JOIN mdcd_demo d
      ON d.mdcd_demo_id = dlv.mdcd_demo_id
    LEFT JOIN mdcd_dlvrbl_rpt_ocrnc_rfrnc typ
      ON typ.mdcd_dlvrbl_rpt_ocrnc_cd = dlv.mdcd_dlvrbl_type_cd
    LEFT JOIN mdcd_dlvrbl_stus_rfrnc st
      ON st.mdcd_dlvrbl_stus_cd = dlv.mdcd_dlvrbl_crnt_stus_cd
    WHERE d.dltd_ind = 0
      AND dlv.dltd_ind = 0
    ORDER BY dlv.mdcd_demo_id, dlv.dlvrbl_due_dt, dlv.mdcd_dlvrbl_id;
    ```

    ```sql
    -- PMDA/MySQL: deliverable status history and comments.
    -- cmt_orgn_cd is important: C = CMS, I = internal, S = state, A = reviewer,
    -- R = resubmission, B = budget-neutrality resubmission.
    SELECT
      h.mdcd_dlvrbl_stus_hstry_id,
      dlv.mdcd_demo_id AS pmda_mdcd_demo_id,
      h.mdcd_dlvrbl_id AS pmda_mdcd_dlvrbl_id,
      h.mdcd_dlvrbl_stus_cd AS pmda_status_code,
      st.mdcd_dlvrbl_stus_name AS pmda_status_name,
      h.creatd_user_id AS pmda_created_user_id,
      h.creatd_dt,
      h.rvwr_1st_name,
      h.rvwr_last_name,
      h.role_cd,
      h.rvw_dt
    FROM mdcd_dlvrbl_stus_hstry h
    JOIN mdcd_dlvrbl dlv
      ON dlv.mdcd_dlvrbl_id = h.mdcd_dlvrbl_id
    JOIN mdcd_demo d
      ON d.mdcd_demo_id = dlv.mdcd_demo_id
    LEFT JOIN mdcd_dlvrbl_stus_rfrnc st
      ON st.mdcd_dlvrbl_stus_cd = h.mdcd_dlvrbl_stus_cd
    WHERE d.dltd_ind = 0
      AND dlv.dltd_ind = 0
      AND h.dltd_ind = 0
    ORDER BY dlv.mdcd_demo_id, h.mdcd_dlvrbl_id, h.creatd_dt;

    SELECT
      c.mdcd_dlvrbl_cmt_id,
      dlv.mdcd_demo_id AS pmda_mdcd_demo_id,
      c.mdcd_dlvrbl_id AS pmda_mdcd_dlvrbl_id,
      c.user_id AS pmda_user_id,
      c.cmt_orgn_cd,
      c.cmt_aftr_acptd_ind,
      c.cmt_txt,
      c.creatd_dt
    FROM mdcd_dlvrbl_cmt c
    JOIN mdcd_dlvrbl dlv
      ON dlv.mdcd_dlvrbl_id = c.mdcd_dlvrbl_id
    JOIN mdcd_demo d
      ON d.mdcd_demo_id = dlv.mdcd_demo_id
    WHERE d.dltd_ind = 0
      AND dlv.dltd_ind = 0
    ORDER BY dlv.mdcd_demo_id, c.mdcd_dlvrbl_id, c.creatd_dt;
    ```

    ```sql
    -- PMDA/MySQL: deliverable file metadata.
    -- This is the bridge for regular documents, BN workbooks, MRT files, and protocol files.
    SELECT
      f.mdcd_dlvrbl_fil_doc_id AS pmda_mdcd_dlvrbl_fil_doc_id,
      f.mdcd_demo_id AS pmda_mdcd_demo_id,
      f.mdcd_dlvrbl_id AS pmda_mdcd_dlvrbl_id,
      f.doc_name,
      f.dlvrbl_fil_name,
      f.intrnl_cmt_txt,
      f.cmt_orgn_cd,
      f.user_id AS pmda_user_id,
      f.creatd_dt,
      f.upld_aftr_acptd_ind,
      f.bdgt_ntrlty_fil_ind,
      f.bdgt_ntrlty_fil_non_crtcl_err_ind,
      f.mntrg_rpt_fil_ind,
      f.mntrg_rpt_fil_non_crtcl_err_ind,
      f.mntrg_rpt_fil_crtcl_err_ind,
      f.mntrg_rpt_fil_doc_id_msmtch_ind,
      f.proc_mntrg_rpt_ind,
      f.mntrg_prtcl_fil_ind,
      f.mntrg_prtcl_fil_non_crtcl_err_ind,
      f.mdcd_demo_type_cd,
      f.fil_doc_cd,
      f.rptg_demo_yr_num,
      f.rptg_qtr_num,
      f.tmplt_fil_doc_id,
      f.procd_ind
    FROM mdcd_dlvrbl_fil_doc f
    JOIN mdcd_dlvrbl dlv
      ON dlv.mdcd_dlvrbl_id = f.mdcd_dlvrbl_id
    JOIN mdcd_demo d
      ON d.mdcd_demo_id = dlv.mdcd_demo_id
    WHERE d.dltd_ind = 0
      AND dlv.dltd_ind = 0
      AND f.dltd_ind = 0
    ORDER BY f.mdcd_demo_id, f.mdcd_dlvrbl_id, f.creatd_dt;

    SELECT
      s.*
    FROM bdgt_ntrlty_fil_doc_stus s
    JOIN mdcd_dlvrbl_fil_doc f
      ON f.mdcd_dlvrbl_fil_doc_id = s.mdcd_dlvrbl_fil_doc_id
    JOIN mdcd_dlvrbl dlv
      ON dlv.mdcd_dlvrbl_id = f.mdcd_dlvrbl_id
    JOIN mdcd_demo d
      ON d.mdcd_demo_id = dlv.mdcd_demo_id
    WHERE d.dltd_ind = 0
      AND dlv.dltd_ind = 0
      AND f.dltd_ind = 0
      AND s.dltd_ind = 0
    ORDER BY f.mdcd_demo_id, f.mdcd_dlvrbl_id, f.mdcd_dlvrbl_fil_doc_id, s.creatd_dt;
    ```

    ```sql
    -- PMDA/MySQL: due-date change requests.
    SELECT
      r.mdcd_due_dt_chg_rqst_id,
      dlv.mdcd_demo_id AS pmda_mdcd_demo_id,
      r.mdcd_dlvrbl_id AS pmda_mdcd_dlvrbl_id,
      r.mdcd_state_user_due_dt_chg_rsn_cd,
      reason.mdcd_state_user_due_dt_chg_rsn_name,
      r.mdcd_due_dt_chg_rqst_dtrmntn_cd,
      det.mdcd_due_dt_chg_rqst_dtrmntn_name,
      r.rqst_dlvrbl_due_dt,
      r.altrnt_dlvrbl_due_dt,
      r.acptd_dlvrbl_due_dt,
      r.orgnl_dlvrbl_due_dt,
      r.mdcd_due_dt_chg_rqst_dtl_txt,
      r.mdcd_dlvrbl_open_endd_ind,
      r.cmt_txt,
      r.rqst_user_id AS pmda_request_user_id,
      r.dtrmntn_user_id AS pmda_determination_user_id,
      r.dtrmntn_dt,
      r.prvs_dlvrbl_stus_cd,
      r.prvs_dlvrbl_stus_dt,
      r.creatd_dt
    FROM mdcd_due_dt_chg_rqst r
    JOIN mdcd_dlvrbl dlv
      ON dlv.mdcd_dlvrbl_id = r.mdcd_dlvrbl_id
    JOIN mdcd_demo d
      ON d.mdcd_demo_id = dlv.mdcd_demo_id
    LEFT JOIN mdcd_state_user_due_dt_chg_rsn_rfrnc reason
      ON reason.mdcd_state_user_due_dt_chg_rsn_cd = r.mdcd_state_user_due_dt_chg_rsn_cd
    LEFT JOIN mdcd_due_dt_chg_rqst_dtrmntn_rfrnc det
      ON det.mdcd_due_dt_chg_rqst_dtrmntn_cd = r.mdcd_due_dt_chg_rqst_dtrmntn_cd
    WHERE d.dltd_ind = 0
      AND dlv.dltd_ind = 0
      AND r.dltd_ind = 0
    ORDER BY dlv.mdcd_demo_id, r.mdcd_dlvrbl_id, r.creatd_dt;
    ```

    ```sql
    -- PMDA/MySQL: deliverable paper records and paper comments.
    SELECT p.*
    FROM mdcd_dlvrbl_paper p
    JOIN mdcd_dlvrbl dlv
      ON dlv.mdcd_dlvrbl_id = p.mdcd_dlvrbl_id
    JOIN mdcd_demo d
      ON d.mdcd_demo_id = dlv.mdcd_demo_id
    WHERE d.dltd_ind = 0
      AND dlv.dltd_ind = 0
      AND p.dltd_ind = 0
    ORDER BY p.mdcd_demo_id, p.mdcd_dlvrbl_id, p.dlvrbl_paper_fil_dt;

    SELECT c.*
    FROM mdcd_dlvrbl_paper_cmt c
    JOIN mdcd_dlvrbl_paper p
      ON p.mdcd_dlvrbl_paper_id = c.mdcd_dlvrbl_paper_id
    JOIN mdcd_dlvrbl dlv
      ON dlv.mdcd_dlvrbl_id = p.mdcd_dlvrbl_id
    JOIN mdcd_demo d
      ON d.mdcd_demo_id = dlv.mdcd_demo_id
    WHERE d.dltd_ind = 0
      AND dlv.dltd_ind = 0
      AND p.dltd_ind = 0
    ORDER BY p.mdcd_demo_id, p.mdcd_dlvrbl_id, c.creatd_dt;
    ```

    ```sql
    -- Demos/Postgres: target-side xrefs for deliverables and deliverable files.
    CREATE TABLE IF NOT EXISTS migration_pmda_deliverable_xref (
      pmda_mdcd_dlvrbl_id integer PRIMARY KEY,
      pmda_mdcd_demo_id integer NOT NULL,
      demos_demonstration_id uuid NOT NULL REFERENCES demos_app.demonstration(id),
      demos_deliverable_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
      pmda_deliverable_type_code integer,
      pmda_deliverable_name text,
      migrated_at timestamptz DEFAULT CURRENT_TIMESTAMP
    );

    INSERT INTO migration_pmda_deliverable_xref (
      pmda_mdcd_dlvrbl_id,
      pmda_mdcd_demo_id,
      demos_demonstration_id,
      pmda_deliverable_type_code,
      pmda_deliverable_name
    )
    SELECT
      d.pmda_mdcd_dlvrbl_id,
      d.pmda_mdcd_demo_id,
      x.demos_demonstration_id,
      d.pmda_deliverable_type_code,
      d.mdcd_dlvrbl_name
    FROM migration_pmda_deliverable_source d
    JOIN migration_pmda_demo_xref x
      ON x.pmda_mdcd_demo_id = d.pmda_mdcd_demo_id
    ON CONFLICT (pmda_mdcd_dlvrbl_id) DO UPDATE
    SET
      demos_demonstration_id = EXCLUDED.demos_demonstration_id,
      pmda_deliverable_type_code = EXCLUDED.pmda_deliverable_type_code,
      pmda_deliverable_name = EXCLUDED.pmda_deliverable_name;

    CREATE TABLE IF NOT EXISTS migration_pmda_deliverable_file_xref (
      pmda_mdcd_dlvrbl_fil_doc_id integer PRIMARY KEY,
      pmda_mdcd_dlvrbl_id integer NOT NULL,
      demos_deliverable_id uuid NOT NULL REFERENCES demos_app.deliverable(id),
      demos_document_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
      pmda_file_name text,
      pmda_document_name text,
      migrated_at timestamptz DEFAULT CURRENT_TIMESTAMP
    );
    ```
7. Load pending application management data separately from approved demos.

    Pending application management is not just another view of `mdcd_demo`. New demonstrations, amendments, and extensions live around `mdcd_pendg_demo` + `mdcd_demo_aplctn`; amendments/extensions can point back to an approved PMDA demo through `mdcd_demo_aplctn.mdcd_demo_id`. Keep this as a separate migration stream and crosswalk it back to approved demos only when that source link exists.

    ```sql
    -- PMDA/MySQL: application-management control values.
    SELECT
      mdcd_demo_aplctn_stus_cd,
      mdcd_demo_aplctn_stus_name,
      dsply_sqnc_num,
      dltd_ind
    FROM mdcd_demo_aplctn_stus_rfrnc
    ORDER BY dsply_sqnc_num;

    SELECT
      mdcd_demo_aplctn_type_cd,
      mdcd_demo_aplctn_type_name,
      dsply_sqnc_num
    FROM mdcd_demo_aplctn_type_rfrnc
    ORDER BY dsply_sqnc_num;

    SELECT
      mdcd_demo_aplctn_doc_type_cd,
      mdcd_demo_aplctn_doc_type_name,
      dsply_sqnc_num
    FROM mdcd_demo_aplctn_doc_type_rfrnc
    ORDER BY dsply_sqnc_num;
    ```

    ```sql
    -- PMDA/MySQL: application rows and their pending-demo shell.
    -- Status 9 is Approved; active/in-process queues usually use 1, 2, 4, 5, and 11.
    SELECT
      a.mdcd_demo_aplctn_id AS pmda_mdcd_demo_aplctn_id,
      a.mdcd_pendg_demo_id AS pmda_mdcd_pendg_demo_id,
      a.mdcd_demo_id AS pmda_approved_mdcd_demo_id,
      a.mdcd_demo_aplctn_type_cd AS pmda_application_type_code,
      atype.mdcd_demo_aplctn_type_name,
      a.mdcd_demo_aplctn_stus_cd AS pmda_application_status_code,
      astat.mdcd_demo_aplctn_stus_name,
      a.mdcd_demo_aplctn_stus_dt,
      p.mdcd_demo_num,
      p.mdcd_demo_name,
      p.geo_ansi_state_cd,
      p.mdcd_demo_desc,
      p.mdcd_chip_div_cd,
      p.mdcd_demo_aplctn_sgntr_lvl_cd,
      p.state_prfmnc_yr_strt_dt,
      p.state_prfmnc_yr_end_dt,
      p.proj_ofcr_user_id,
      p.bkup_proj_ofcr_user_id,
      p.tchncl_drctr_user_id,
      p.mntrg_eval_tchncl_drctr_user_id,
      p.ro_fincl_lead_user_id,
      p.ro_mntrg_lead_user_id,
      p.anlyst_user_id,
      p.anlyst_scndry_user_id,
      p.mc_anlyst_id,
      p.hcbs_anlyst_id,
      p.state_prmry_poc_user_id,
      p.state_scndry_poc_user_id,
      p.state_3rd_poc_user_id,
      p.state_4th_poc_user_id,
      p.state_5th_poc_user_id,
      a.phase_1_strt_dt,
      a.phase_1_end_dt,
      a.phase_2_rcvd_dt,
      a.phase_2_cmpltns_rvw_dt,
      a.phase_2_state_aplctn_deemd_cmpltn_dt,
      a.phase_2_fed_cmt_prd_strt_dt,
      a.phase_2_fed_cmt_prd_end_dt,
      a.phase_2_dsrd_aprvl_dt,
      a.phase_2_dsrd_aprvl_dt_tbd_ind,
      a.phase_2_dsrd_aprvl_dt_firm_ind,
      a.phase_3_a_sme_strt_dt,
      a.phase_3_a_sme_end_dt,
      a.phase_3_a_frvt_strt_dt,
      a.phase_3_a_frvt_end_dt,
      a.phase_3_b_cmcs_strt_dt,
      a.phase_3_b_cmcs_end_dt,
      a.phase_3_b_ogc_strt_dt,
      a.phase_3_b_ogc_end_dt,
      a.phase_3_b_omb_strt_dt,
      a.phase_3_b_omb_end_dt,
      a.phase_3_c_ogc_strt_dt,
      a.phase_3_c_ogc_end_dt,
      a.phase_3_c_omb_strt_dt,
      a.phase_3_c_omb_end_dt,
      a.phase_4_strt_dt,
      a.phase_4_end_dt,
      a.phase_5_strt_dt,
      a.phase_5_end_dt,
      a.phase_6_strt_dt,
      a.phase_6_end_dt,
      a.prtl_aprvl_ind,
      a.bdgt_ntrlty_rptg_rqrd_ind,
      p.creatd_dt AS pending_demo_created_at,
      a.creatd_dt AS application_created_at,
      a.updtd_dt AS application_updated_at
    FROM mdcd_demo_aplctn a
    JOIN mdcd_pendg_demo p
      ON p.mdcd_pendg_demo_id = a.mdcd_pendg_demo_id
    LEFT JOIN mdcd_demo_aplctn_type_rfrnc atype
      ON atype.mdcd_demo_aplctn_type_cd = a.mdcd_demo_aplctn_type_cd
    LEFT JOIN mdcd_demo_aplctn_stus_rfrnc astat
      ON astat.mdcd_demo_aplctn_stus_cd = a.mdcd_demo_aplctn_stus_cd
    LEFT JOIN mdcd_demo approved
      ON approved.mdcd_demo_id = a.mdcd_demo_id
    WHERE p.dltd_ind = 0
      AND a.dltd_ind = 0
      -- Add this line when the target scope is only in-process work:
      -- AND a.mdcd_demo_aplctn_stus_cd IN (1, 2, 4, 5, 11)
    ORDER BY p.geo_ansi_state_cd, p.mdcd_demo_name, a.mdcd_demo_aplctn_id;
    ```

    ```sql
    -- PMDA/MySQL: pending programs and pending demo-type rollup.
    SELECT
      pp.mdcd_pendg_pgm_id AS pmda_mdcd_pendg_pgm_id,
      pp.mdcd_pendg_demo_id AS pmda_mdcd_pendg_demo_id,
      pp.mdcd_pgm_id AS pmda_approved_mdcd_pgm_id,
      pp.pgm_name,
      pp.pgm_desc,
      pp.prfmnc_prd_from_dt,
      pp.prfmnc_prd_to_dt,
      pp.aprvl_ind,
      pp.creatd_dt,
      pp.updtd_dt
    FROM mdcd_pendg_pgm pp
    JOIN mdcd_pendg_demo pd
      ON pd.mdcd_pendg_demo_id = pp.mdcd_pendg_demo_id
    JOIN mdcd_demo_aplctn a
      ON a.mdcd_pendg_demo_id = pd.mdcd_pendg_demo_id
    WHERE pd.dltd_ind = 0
      AND pp.dltd_ind = 0
      AND a.dltd_ind = 0
    ORDER BY pd.mdcd_pendg_demo_id, pp.pgm_name, pp.mdcd_pendg_pgm_id;

    SELECT
      v.mdcd_pendg_demo_id AS pmda_mdcd_pendg_demo_id,
      v.mdcd_pendg_pgm_id AS pmda_mdcd_pendg_pgm_id,
      v.name AS pmda_demo_type_code,
      r.mdcd_demo_type_name,
      v.title,
      v.detailed_name,
      v.id AS pmda_demo_type_detail_id,
      v.from_dt,
      v.to_dt,
      v.aprvl_ind,
      v.mdcd_pymt_ratio_ind
    FROM v_app_mgmt_demo_types v
    JOIN mdcd_pendg_pgm pp
      ON pp.mdcd_pendg_pgm_id = v.mdcd_pendg_pgm_id
    JOIN mdcd_pendg_demo pd
      ON pd.mdcd_pendg_demo_id = pp.mdcd_pendg_demo_id
    LEFT JOIN mdcd_demo_type_rfrnc r
      ON r.mdcd_demo_type_cd = v.name
    WHERE pd.dltd_ind = 0
      AND pp.dltd_ind = 0
    ORDER BY v.mdcd_pendg_demo_id, v.mdcd_pendg_pgm_id, r.dsply_sqnc_num, v.detailed_name;
    ```

    ```sql
    -- PMDA/MySQL: comments, policy decisions, and policy decision history.
    SELECT
      c.mdcd_demo_aplctn_cmt_id,
      c.mdcd_demo_aplctn_id AS pmda_mdcd_demo_aplctn_id,
      a.mdcd_pendg_demo_id AS pmda_mdcd_pendg_demo_id,
      c.cmt_type_cd,
      c.cmt_txt,
      c.creatd_user_id,
      c.creatd_dt,
      c.updtd_user_id,
      c.updtd_dt
    FROM mdcd_demo_aplctn_cmt c
    JOIN mdcd_demo_aplctn a
      ON a.mdcd_demo_aplctn_id = c.mdcd_demo_aplctn_id
    JOIN mdcd_pendg_demo p
      ON p.mdcd_pendg_demo_id = a.mdcd_pendg_demo_id
    WHERE p.dltd_ind = 0
      AND a.dltd_ind = 0
    ORDER BY a.mdcd_pendg_demo_id, c.creatd_dt;

    SELECT
      f.mdcd_fed_exctv_plcy_dcsn_id,
      f.mdcd_demo_aplctn_id AS pmda_mdcd_demo_aplctn_id,
      a.mdcd_pendg_demo_id AS pmda_mdcd_pendg_demo_id,
      f.oa_rptd_dt,
      f.dcsn_dt,
      f.key_iss_txt,
      f.dsply_sqnc_num,
      f.creatd_user_id,
      f.creatd_dt,
      f.updtd_user_id,
      f.updtd_dt
    FROM mdcd_fed_exctv_plcy_dcsn f
    JOIN mdcd_demo_aplctn a
      ON a.mdcd_demo_aplctn_id = f.mdcd_demo_aplctn_id
    JOIN mdcd_pendg_demo p
      ON p.mdcd_pendg_demo_id = a.mdcd_pendg_demo_id
    WHERE p.dltd_ind = 0
      AND a.dltd_ind = 0
      AND f.dltd_ind = 0
    ORDER BY a.mdcd_pendg_demo_id, f.dsply_sqnc_num, f.mdcd_fed_exctv_plcy_dcsn_id;

    SELECT
      h.mdcd_fed_exctv_plcy_dcsn_hstry_id,
      h.mdcd_fed_exctv_plcy_dcsn_id,
      h.mdcd_demo_aplctn_id AS pmda_mdcd_demo_aplctn_id,
      a.mdcd_pendg_demo_id AS pmda_mdcd_pendg_demo_id,
      h.oa_rptd_dt,
      h.dcsn_dt,
      h.key_iss_txt,
      h.dsply_sqnc_num,
      h.hstry_ts
    FROM mdcd_fed_exctv_plcy_dcsn_hstry h
    JOIN mdcd_demo_aplctn a
      ON a.mdcd_demo_aplctn_id = h.mdcd_demo_aplctn_id
    JOIN mdcd_pendg_demo p
      ON p.mdcd_pendg_demo_id = a.mdcd_pendg_demo_id
    WHERE p.dltd_ind = 0
      AND a.dltd_ind = 0
      AND h.dltd_ind = 0
    ORDER BY a.mdcd_pendg_demo_id, h.mdcd_fed_exctv_plcy_dcsn_id, h.hstry_ts;
    ```

    ```sql
    -- PMDA/MySQL: application document repository and uploaded file metadata.
    -- dtl is one document record; fil is the versioned/uploaded file row.
    SELECT
      dtl.mdcd_demo_aplctn_doc_rpstry_dtl_id,
      dtl.mdcd_pendg_demo_id AS pmda_mdcd_pendg_demo_id,
      a.mdcd_demo_aplctn_id AS pmda_mdcd_demo_aplctn_id,
      a.mdcd_demo_id AS pmda_approved_mdcd_demo_id,
      dtl.mdcd_demo_aplctn_doc_desc,
      dtl.mdcd_demo_aplctn_doc_type_cd,
      typ.mdcd_demo_aplctn_doc_type_name,
      CASE
        WHEN dtl.mdcd_demo_aplctn_doc_type_cd = 99 THEN dtl.mdcd_demo_aplctn_doc_othr_type_desc
        ELSE typ.mdcd_demo_aplctn_doc_type_name
      END AS resolved_doc_type_name,
      dtl.state_prvdd_ind,
      fil.mdcd_demo_aplctn_doc_rpstry_fil_id,
      fil.upldd_fil_name,
      fil.orgnl_fil_name,
      fil.vrsn_ind,
      fil.cmt_txt AS file_comment,
      dtl.creatd_dt AS document_created_at,
      fil.creatd_dt AS file_created_at
    FROM mdcd_demo_aplctn_doc_rpstry_dtl dtl
    JOIN mdcd_demo_aplctn a
      ON a.mdcd_pendg_demo_id = dtl.mdcd_pendg_demo_id
    JOIN mdcd_pendg_demo p
      ON p.mdcd_pendg_demo_id = dtl.mdcd_pendg_demo_id
    LEFT JOIN mdcd_demo_aplctn_doc_rpstry_fil fil
      ON fil.mdcd_demo_aplctn_doc_rpstry_dtl_id = dtl.mdcd_demo_aplctn_doc_rpstry_dtl_id
      AND fil.dltd_ind = 0
    LEFT JOIN mdcd_demo_aplctn_doc_type_rfrnc typ
      ON typ.mdcd_demo_aplctn_doc_type_cd = dtl.mdcd_demo_aplctn_doc_type_cd
    WHERE p.dltd_ind = 0
      AND a.dltd_ind = 0
      AND dtl.dltd_ind = 0
    ORDER BY dtl.mdcd_pendg_demo_id, typ.dsply_sqnc_num, dtl.creatd_dt, fil.creatd_dt;
    ```

    ```sql
    -- Demos/Postgres: keep a first-class application crosswalk.
    -- For amendments/extensions, demos_existing_demonstration_id should point to the approved demo xref.
    CREATE TABLE IF NOT EXISTS migration_pmda_application_xref (
      pmda_mdcd_demo_aplctn_id integer PRIMARY KEY,
      pmda_mdcd_pendg_demo_id integer NOT NULL,
      pmda_approved_mdcd_demo_id integer,
      demos_existing_demonstration_id uuid,
      demos_application_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
      pmda_application_type_code integer,
      pmda_application_status_code integer,
      migrated_at timestamptz DEFAULT CURRENT_TIMESTAMP
    );

    INSERT INTO migration_pmda_application_xref (
      pmda_mdcd_demo_aplctn_id,
      pmda_mdcd_pendg_demo_id,
      pmda_approved_mdcd_demo_id,
      demos_existing_demonstration_id,
      pmda_application_type_code,
      pmda_application_status_code
    )
    SELECT
      src.pmda_mdcd_demo_aplctn_id,
      src.pmda_mdcd_pendg_demo_id,
      src.pmda_approved_mdcd_demo_id,
      demo_xref.demos_demonstration_id,
      src.pmda_application_type_code,
      src.pmda_application_status_code
    FROM migration_pmda_application_source src
    LEFT JOIN migration_pmda_demo_xref demo_xref
      ON demo_xref.pmda_mdcd_demo_id = src.pmda_approved_mdcd_demo_id
    ON CONFLICT (pmda_mdcd_demo_aplctn_id) DO UPDATE
    SET
      pmda_mdcd_pendg_demo_id = EXCLUDED.pmda_mdcd_pendg_demo_id,
      pmda_approved_mdcd_demo_id = EXCLUDED.pmda_approved_mdcd_demo_id,
      demos_existing_demonstration_id = EXCLUDED.demos_existing_demonstration_id,
      pmda_application_type_code = EXCLUDED.pmda_application_type_code,
      pmda_application_status_code = EXCLUDED.pmda_application_status_code;

    -- Reconciliation: amendments/extensions that failed to link to an approved migrated demo.
    SELECT
      pmda_mdcd_demo_aplctn_id,
      pmda_mdcd_pendg_demo_id,
      pmda_approved_mdcd_demo_id,
      pmda_application_type_code
    FROM migration_pmda_application_xref
    WHERE pmda_application_type_code IN (2, 3)
      AND pmda_approved_mdcd_demo_id IS NOT NULL
      AND demos_existing_demonstration_id IS NULL
    ORDER BY pmda_mdcd_demo_aplctn_id;
    ```
8. Load BN/MRT/STC only if those workflows are expected to work in Demos.

    Treat these as workflow migrations, not simple file copies. If Demos only needs document history, migrate the file rows and source filenames. If Demos needs the old PMDA feature behavior, also migrate the parsed workbook/report tables keyed by `mdcd_demo_id`, `mdcd_dlvrbl_id`, `mdcd_dlvrbl_fil_doc_id`, and the relevant template file id.

    ```sql
    -- PMDA/MySQL: Budget Neutrality template files.
    SELECT
      t.bdgt_ntrlty_tmplt_fil_doc_id,
      t.mdcd_demo_id AS pmda_mdcd_demo_id,
      t.upldd_fil_name,
      t.orgnl_fil_name,
      t.bdgt_ntrlty_tmplt_fil_desc,
      t.crnt_ind,
      t.tmplt_fil_doc_type_cd,
      typ.tmplt_fil_doc_type_name,
      t.bdgt_ntrlty_actv_prfmnc_strt_demo_yr_num,
      t.bdgt_ntrlty_actv_prfmnc_end_demo_yr_num,
      t.user_id,
      t.creatd_dt,
      t.aprvd_dt,
      t.aprvd_user_id
    FROM bdgt_ntrlty_tmplt_fil_doc t
    JOIN mdcd_demo d
      ON d.mdcd_demo_id = t.mdcd_demo_id
    LEFT JOIN tmplt_fil_doc_type_rfrnc typ
      ON typ.tmplt_fil_doc_type_cd = t.tmplt_fil_doc_type_cd
    WHERE d.dltd_ind = 0
      AND t.dltd_ind = 0
    ORDER BY t.mdcd_demo_id, t.crnt_ind DESC, t.bdgt_ntrlty_tmplt_fil_doc_id DESC;

    -- PMDA/MySQL: Budget Neutrality deliverable workbook files.
    SELECT
      f.mdcd_dlvrbl_fil_doc_id,
      f.mdcd_dlvrbl_id AS pmda_mdcd_dlvrbl_id,
      f.mdcd_demo_id AS pmda_mdcd_demo_id,
      f.doc_name,
      f.dlvrbl_fil_name,
      f.bdgt_ntrlty_fil_ind,
      f.bdgt_ntrlty_fil_non_crtcl_err_ind,
      f.tmplt_fil_doc_id AS pmda_bdgt_ntrlty_tmplt_fil_doc_id,
      f.procd_ind,
      f.user_id,
      f.creatd_dt
    FROM mdcd_dlvrbl_fil_doc f
    JOIN mdcd_dlvrbl dl
      ON dl.mdcd_dlvrbl_id = f.mdcd_dlvrbl_id
    JOIN mdcd_demo d
      ON d.mdcd_demo_id = f.mdcd_demo_id
    WHERE d.dltd_ind = 0
      AND dl.dltd_ind = 0
      AND f.dltd_ind = 0
      AND f.bdgt_ntrlty_fil_ind = 1
    ORDER BY f.mdcd_demo_id, f.mdcd_dlvrbl_id, f.creatd_dt;
    ```

    ```sql
    -- PMDA/MySQL: Budget Neutrality parsed-data examples.
    -- These rows are the workbook facts; file-only migration will not preserve them.
    SELECT y.*
    FROM bdgt_ntrlty_demo_yr y
    JOIN mdcd_demo d ON d.mdcd_demo_id = y.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND y.dltd_ind = 0
    ORDER BY y.mdcd_demo_id, y.bdgt_ntrlty_tmplt_fil_doc_id, y.sqnc_num;

    SELECT meg.*
    FROM bdgt_ntrlty_mdcd_elgblty_grp meg
    JOIN mdcd_demo d ON d.mdcd_demo_id = meg.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND meg.dltd_ind = 0
    ORDER BY meg.mdcd_demo_id, meg.bdgt_ntrlty_tmplt_fil_doc_id, meg.bdgt_ntrlty_mdcd_elgblty_grp_id;

    SELECT pop.*
    FROM bdgt_ntrlty_mdcd_elgblty_grp_pop pop
    JOIN bdgt_ntrlty_mdcd_elgblty_grp meg
      ON meg.bdgt_ntrlty_mdcd_elgblty_grp_id = pop.bdgt_ntrlty_mdcd_elgblty_grp_id
    JOIN mdcd_demo d
      ON d.mdcd_demo_id = pop.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND meg.dltd_ind = 0 AND pop.dltd_ind = 0
    ORDER BY pop.mdcd_demo_id, pop.bdgt_ntrlty_tmplt_fil_doc_id, pop.bdgt_ntrlty_mdcd_elgblty_grp_id, pop.row_num;

    SELECT w.*
    FROM bdgt_ntrlty_wvr w
    JOIN mdcd_demo d ON d.mdcd_demo_id = w.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND w.dltd_ind = 0
    ORDER BY w.mdcd_demo_id, w.bdgt_ntrlty_tmplt_fil_doc_id, w.row_num;

    SELECT pmpm.*
    FROM bdgt_ntrlty_wthot_wvr_pmpm_cst pmpm
    JOIN mdcd_demo d ON d.mdcd_demo_id = pmpm.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND pmpm.dltd_ind = 0
    ORDER BY pmpm.mdcd_demo_id, pmpm.mdcd_dlvrbl_fil_doc_id, pmpm.bdgt_ntrlty_demo_yr_id;

    SELECT with_wvr.*
    FROM bdgt_ntrlty_wth_wvr_spnd_prjtd_cst with_wvr
    JOIN mdcd_demo d ON d.mdcd_demo_id = with_wvr.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND with_wvr.dltd_ind = 0
    ORDER BY with_wvr.mdcd_demo_id, with_wvr.mdcd_dlvrbl_fil_doc_id, with_wvr.bdgt_ntrlty_demo_yr_id;

    SELECT msg.*
    FROM bdgt_ntrlty_fil_doc_msg msg
    JOIN mdcd_demo d ON d.mdcd_demo_id = msg.mdcd_demo_id
    WHERE d.dltd_ind = 0
    ORDER BY msg.mdcd_demo_id, msg.mdcd_dlvrbl_fil_doc_id, msg.bdgt_ntrlty_fil_doc_msg_id;
    ```

    ```sql
    -- PMDA/MySQL: MRT template/instruction files.
    SELECT
      t.tmplt_fil_doc_id,
      t.mdcd_demo_id AS pmda_mdcd_demo_id,
      t.mdcd_demo_type_cd,
      t.plcy_area_type_cd,
      pa.plcy_area_type_name,
      t.upldd_fil_name,
      t.orgnl_fil_name,
      t.tmplt_fil_desc,
      t.tmplt_fil_doc_type_cd,
      typ.tmplt_fil_doc_type_name,
      typ.tmplt_ind,
      typ.dlvrbl_type_cd,
      t.tmplt_fil_doc_vrsn,
      t.crnt_ind,
      t.submsn_dt,
      t.user_id,
      t.creatd_dt,
      t.aprvd_dt,
      t.aprvd_user_id
    FROM tmplt_fil_doc t
    JOIN mdcd_demo d
      ON d.mdcd_demo_id = t.mdcd_demo_id
    LEFT JOIN tmplt_fil_doc_type_rfrnc typ
      ON typ.tmplt_fil_doc_type_cd = t.tmplt_fil_doc_type_cd
    LEFT JOIN plcy_area_type_rfrnc pa
      ON pa.plcy_area_type_cd = t.plcy_area_type_cd
    WHERE d.dltd_ind = 0
      AND t.dltd_ind = 0
    ORDER BY t.mdcd_demo_id, t.mdcd_demo_type_cd, t.tmplt_fil_doc_id DESC;

    -- PMDA/MySQL: MRT deliverable uploads and processing flags.
    SELECT
      f.mdcd_dlvrbl_fil_doc_id,
      f.mdcd_dlvrbl_id AS pmda_mdcd_dlvrbl_id,
      f.mdcd_demo_id AS pmda_mdcd_demo_id,
      f.mdcd_demo_type_cd,
      f.fil_doc_cd,
      f.doc_name,
      f.dlvrbl_fil_name,
      f.mntrg_rpt_fil_ind,
      f.mntrg_prtcl_fil_ind,
      f.mntrg_rpt_fil_non_crtcl_err_ind,
      f.mntrg_rpt_fil_crtcl_err_ind,
      f.proc_mntrg_rpt_ind,
      f.tmplt_fil_doc_id,
      f.rptg_demo_yr_num,
      f.rptg_qtr_num,
      f.data_extrct_dt,
      f.for_the_time_prd_thru_dt,
      f.user_id,
      f.creatd_dt
    FROM mdcd_dlvrbl_fil_doc f
    JOIN mdcd_dlvrbl dl
      ON dl.mdcd_dlvrbl_id = f.mdcd_dlvrbl_id
    JOIN mdcd_demo d
      ON d.mdcd_demo_id = f.mdcd_demo_id
    WHERE d.dltd_ind = 0
      AND dl.dltd_ind = 0
      AND f.dltd_ind = 0
      AND (
        f.mntrg_rpt_fil_ind = 1
        OR f.mntrg_prtcl_fil_ind = 1
        OR f.proc_mntrg_rpt_ind = 1
      )
    ORDER BY f.mdcd_demo_id, f.mdcd_dlvrbl_id, f.creatd_dt;
    ```

    ```sql
    -- PMDA/MySQL: MRT parsed SUD/SMI report examples.
    SELECT p.*
    FROM mdcd_sud_mntrg_prtcl_rpt p
    JOIN mdcd_demo d ON d.mdcd_demo_id = p.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND p.dltd_ind = 0
    ORDER BY p.mdcd_demo_id, p.mdcd_dlvrbl_fil_doc_id;

    SELECT wkbk.*
    FROM mdcd_sud_mntrg_prtcl_wkbk wkbk
    JOIN mdcd_demo d ON d.mdcd_demo_id = wkbk.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND wkbk.dltd_ind = 0
    ORDER BY wkbk.mdcd_demo_id, wkbk.mdcd_dlvrbl_fil_doc_id, wkbk.msr_num;

    SELECT rpt.*
    FROM mdcd_sud_mntrg_mtrc_rpt rpt
    JOIN mdcd_demo d ON d.mdcd_demo_id = rpt.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND rpt.dltd_ind = 0
    ORDER BY rpt.mdcd_demo_id, rpt.mdcd_dlvrbl_fil_doc_id;

    SELECT metric.*
    FROM mdcd_sud_mntrg_rpt_mtrc metric
    JOIN mdcd_demo d ON d.mdcd_demo_id = metric.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND metric.dltd_ind = 0
    ORDER BY metric.mdcd_demo_id, metric.mdcd_dlvrbl_file_doc_id, metric.msr_num;

    SELECT meg.*
    FROM mntrg_rpt_mtrc_mdcd_elgblty_grp meg
    JOIN mdcd_sud_mntrg_rpt_mtrc metric
      ON metric.mdcd_sud_mntrg_rpt_mtrc_id = meg.mdcd_sud_mntrg_rpt_mtrc_id
    JOIN mdcd_demo d
      ON d.mdcd_demo_id = metric.mdcd_demo_id
    WHERE d.dltd_ind = 0
      AND metric.dltd_ind = 0
      AND meg.dltd_ind = 0
    ORDER BY metric.mdcd_demo_id, metric.mdcd_dlvrbl_file_doc_id, metric.msr_num;

    SELECT smi.*
    FROM mdcd_smi_mntrg_prtcl_rpt smi
    JOIN mdcd_demo d ON d.mdcd_demo_id = smi.mdcd_demo_id
    WHERE d.dltd_ind = 0 AND smi.dltd_ind = 0
    ORDER BY smi.mdcd_demo_id, smi.mdcd_dlvrbl_fil_doc_id;

    SELECT msg.*
    FROM mntrg_rpt_prtcl_fil_doc_msg msg
    JOIN mdcd_demo d ON d.mdcd_demo_id = msg.mdcd_demo_id
    WHERE d.dltd_ind = 0
    ORDER BY msg.mdcd_demo_id, msg.mdcd_dlvrbl_fil_doc_id, msg.mntrg_rpt_prtcl_fil_doc_msg_id;
    ```

    ```sql
    -- PMDA/MySQL: STC documents, bookmarks, bookmark text, carts, and templates.
    SELECT doc.*
    FROM spcl_term_and_cond_doc doc
    JOIN mdcd_demo d
      ON d.mdcd_demo_id = doc.mdcd_demo_id
    WHERE d.dltd_ind = 0
      AND doc.dltd_ind = 0
    ORDER BY doc.mdcd_demo_id, doc.aprvl_dt DESC, doc.spcl_term_and_cond_doc_id;

    SELECT
      b.*,
      txt.bkmrk_txt,
      xml.bkmrk_xml_txt,
      doc.mdcd_demo_id AS pmda_mdcd_demo_id
    FROM spcl_term_and_cond_doc_bkmrk b
    JOIN spcl_term_and_cond_doc doc
      ON doc.spcl_term_and_cond_doc_id = b.spcl_term_and_cond_doc_id
    LEFT JOIN spcl_term_and_cond_doc_bkmrk_txt txt
      ON txt.spcl_term_and_cond_doc_bkmrk_id = b.spcl_term_and_cond_doc_bkmrk_id
    LEFT JOIN spcl_term_and_cond_doc_bkmrk_xml_txt xml
      ON xml.spcl_term_and_cond_doc_bkmrk_id = b.spcl_term_and_cond_doc_bkmrk_id
    JOIN mdcd_demo d
      ON d.mdcd_demo_id = doc.mdcd_demo_id
    WHERE d.dltd_ind = 0
      AND doc.dltd_ind = 0
      AND b.wthdrwn_ind = 0
    ORDER BY doc.mdcd_demo_id, b.spcl_term_and_cond_doc_id, b.dsply_sqnc_num;

    SELECT cart.*
    FROM spcl_term_and_cond_fil_bkmrk_cart cart
    JOIN mdcd_demo d
      ON d.mdcd_demo_id = cart.mdcd_demo_id
    WHERE d.dltd_ind = 0
    ORDER BY cart.mdcd_demo_id, cart.user_id, cart.spcl_term_and_cond_tmplt_sect_id, cart.dsply_sqnc_num;

    SELECT hstry.*
    FROM spcl_term_and_cond_fil_bkmrk_cart_hstry hstry
    JOIN mdcd_demo d
      ON d.mdcd_demo_id = hstry.mdcd_demo_id
    WHERE d.dltd_ind = 0
    ORDER BY hstry.mdcd_demo_id, hstry.lock_dt;

    SELECT
      tmplt.*,
      sect.spcl_term_and_cond_tmplt_sect_id,
      sect.tmplt_sect_prex_txt,
      sect.tmplt_sect_name,
      sect.dsply_sqnc_num
    FROM spcl_term_and_cond_tmplt tmplt
    JOIN spcl_term_and_cond_tmplt_sect sect
      ON sect.spcl_term_and_cond_tmplt_id = tmplt.spcl_term_and_cond_tmplt_id
    ORDER BY tmplt.spcl_term_and_cond_tmplt_id, sect.dsply_sqnc_num;
    ```
9. Reconcile by counts per demo/state: demos, programs, deliverables, files, comments, pending apps, BN files, MRT files, STC docs.

    ```sql
    -- PMDA/MySQL: source-side workflow counts by demo.
    SELECT
      d.mdcd_demo_id AS pmda_mdcd_demo_id,
      d.geo_ansi_state_cd,
      d.mdcd_demo_name,
      COUNT(DISTINCT p.mdcd_pgm_id) AS program_count,
      COUNT(DISTINCT dl.mdcd_dlvrbl_id) AS deliverable_count,
      COUNT(DISTINCT f.mdcd_dlvrbl_fil_doc_id) AS deliverable_file_count,
      COUNT(DISTINCT CASE WHEN f.bdgt_ntrlty_fil_ind = 1 THEN f.mdcd_dlvrbl_fil_doc_id END) AS bn_file_count,
      COUNT(DISTINCT CASE WHEN f.mntrg_rpt_fil_ind = 1 OR f.mntrg_prtcl_fil_ind = 1 THEN f.mdcd_dlvrbl_fil_doc_id END) AS mrt_file_count,
      COUNT(DISTINCT c.mdcd_demo_cmt_id) AS demo_comment_count,
      COUNT(DISTINCT stc.spcl_term_and_cond_doc_id) AS stc_doc_count
    FROM mdcd_demo d
    LEFT JOIN mdcd_pgm p
      ON p.mdcd_demo_id = d.mdcd_demo_id
      AND p.dltd_ind = 0
    LEFT JOIN mdcd_dlvrbl dl
      ON dl.mdcd_demo_id = d.mdcd_demo_id
      AND dl.dltd_ind = 0
    LEFT JOIN mdcd_dlvrbl_fil_doc f
      ON f.mdcd_dlvrbl_id = dl.mdcd_dlvrbl_id
      AND f.dltd_ind = 0
    LEFT JOIN mdcd_demo_cmt c
      ON c.mdcd_demo_id = d.mdcd_demo_id
    LEFT JOIN spcl_term_and_cond_doc stc
      ON stc.mdcd_demo_id = d.mdcd_demo_id
      AND stc.dltd_ind = 0
    WHERE d.dltd_ind = 0
    GROUP BY d.mdcd_demo_id, d.geo_ansi_state_cd, d.mdcd_demo_name
    ORDER BY d.geo_ansi_state_cd, d.mdcd_demo_name;
    ```

The biggest warning: `dltd_ind = 0` gives you active rows, but deleted/history rows may still matter for audit, status trails, comments, and file provenance. Also, PMDA has many “metadata-looking” reference codes that are actually control flow, especially deliverable statuses, app statuses, demo types, document types, and comment origins.
