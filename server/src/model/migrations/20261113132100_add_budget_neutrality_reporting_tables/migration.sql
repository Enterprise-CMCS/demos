BEGIN;

CREATE TABLE "budget_neutrality_workbook_test_value" (
    "id" UUID NOT NULL,
    "workbook_id" UUID NOT NULL,
    "test_id" TEXT NOT NULL,
    "measure_id" TEXT NOT NULL,
    "meg_name" TEXT,
    "dy_number" INTEGER,
    "value" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "budget_neutrality_workbook_test_value_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "bn_workbook_test_value_nnd_key" UNIQUE NULLS NOT DISTINCT ("workbook_id", "test_id", "measure_id", "meg_name", "dy_number"),
    CONSTRAINT "check_bn_workbook_test_value_vocabulary" CHECK (
        "test_id" IN (
            'Main', 'Hypothetical 1', 'Hypothetical 2', 'Hypothetical 3',
            'Hypothetical 4', 'Hypothetical 5', 'Hypothetical 6',
            'Hypothetical 7', 'Hypothetical 8', 'Hypothetical 9',
            'Hypothetical 10', 'Hypothetical 11', 'Hypothetical 12',
            'Hypothetical 13', 'Hypothetical 14', 'Hypothetical 15'
        ) AND "measure_id" IN (
            'Without-Waiver Total', 'With-Waiver Total',
            'Expenditure Authority', 'Net Variance'
        )
    )
);

CREATE TABLE "budget_neutrality_workbook_test_year" (
    "workbook_id" UUID NOT NULL,
    "test_id" TEXT NOT NULL,
    "dy_number" INTEGER NOT NULL,
    "cap_needed" BOOLEAN,

    CONSTRAINT "budget_neutrality_workbook_test_year_pkey" PRIMARY KEY ("workbook_id", "test_id", "dy_number"),
    CONSTRAINT "check_bn_workbook_test_year_test_id" CHECK (
        "test_id" IN (
            'Main', 'Hypothetical 1', 'Hypothetical 2', 'Hypothetical 3',
            'Hypothetical 4', 'Hypothetical 5', 'Hypothetical 6',
            'Hypothetical 7', 'Hypothetical 8', 'Hypothetical 9',
            'Hypothetical 10', 'Hypothetical 11', 'Hypothetical 12',
            'Hypothetical 13', 'Hypothetical 14', 'Hypothetical 15'
        )
    )
);

CREATE TABLE "budget_neutrality_workbook_spending_limit" (
    "workbook_id" UUID NOT NULL,
    "program_index" INTEGER NOT NULL,
    "program_name" TEXT NOT NULL,
    "cap_total" DECIMAL(18,2),
    "variance_total" DECIMAL(18,2),
    "over_cap" BOOLEAN,

    CONSTRAINT "budget_neutrality_workbook_spending_limit_pkey" PRIMARY KEY ("workbook_id", "program_index")
);

CREATE TABLE "budget_neutrality_workbook_spending_limit_meg" (
    "workbook_id" UUID NOT NULL,
    "program_index" INTEGER NOT NULL,
    "line_number" INTEGER NOT NULL,
    "meg_name" TEXT NOT NULL,
    "subject_to_cap_total" DECIMAL(18,2),

    CONSTRAINT "budget_neutrality_workbook_spending_limit_meg_pkey" PRIMARY KEY ("workbook_id", "program_index", "line_number")
);

ALTER TABLE "budget_neutrality_workbook_test_value"
    ADD CONSTRAINT "budget_neutrality_workbook_test_value_workbook_id_fkey"
    FOREIGN KEY ("workbook_id") REFERENCES "budget_neutrality_workbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "budget_neutrality_workbook_test_year"
    ADD CONSTRAINT "budget_neutrality_workbook_test_year_workbook_id_fkey"
    FOREIGN KEY ("workbook_id") REFERENCES "budget_neutrality_workbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "budget_neutrality_workbook_spending_limit"
    ADD CONSTRAINT "budget_neutrality_workbook_spending_limit_workbook_id_fkey"
    FOREIGN KEY ("workbook_id") REFERENCES "budget_neutrality_workbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "budget_neutrality_workbook_spending_limit_meg"
    ADD CONSTRAINT "bn_workbook_spending_limit_meg_parent_fkey"
    FOREIGN KEY ("workbook_id", "program_index")
    REFERENCES "budget_neutrality_workbook_spending_limit"("workbook_id", "program_index") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
