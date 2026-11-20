BEGIN;

CREATE TABLE "budget_neutrality_measure" (
    "id" TEXT NOT NULL,

    CONSTRAINT "budget_neutrality_measure_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "budget_neutrality_hypothetical" (
    "id" TEXT NOT NULL,

    CONSTRAINT "budget_neutrality_hypothetical_pkey" PRIMARY KEY ("id")
);

INSERT INTO "budget_neutrality_hypothetical" ("id") VALUES
    ('Main'),
    ('Hypothetical 1'),
    ('Hypothetical 2'),
    ('Hypothetical 3'),
    ('Hypothetical 4'),
    ('Hypothetical 5'),
    ('Hypothetical 6'),
    ('Hypothetical 7'),
    ('Hypothetical 8'),
    ('Hypothetical 9'),
    ('Hypothetical 10'),
    ('Hypothetical 11'),
    ('Hypothetical 12'),
    ('Hypothetical 13'),
    ('Hypothetical 14'),
    ('Hypothetical 15');

INSERT INTO "budget_neutrality_measure" ("id") VALUES
    ('Without-Waiver Total'),
    ('With-Waiver Total'),
    ('Expenditure Authority'),
    ('Net Variance');

CREATE TABLE "budget_neutrality_workbook_hypothetical_value" (
    "id" UUID NOT NULL,
    "workbook_id" UUID NOT NULL,
    "hypothetical_id" TEXT NOT NULL,
    "measure_id" TEXT NOT NULL,
    "meg_name" TEXT,
    "dy_number" INTEGER,
    "value" DECIMAL(18,2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "budget_neutrality_workbook_hypothetical_value_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "bn_workbook_hypothetical_value_nnd_key" UNIQUE NULLS NOT DISTINCT ("workbook_id", "hypothetical_id", "measure_id", "meg_name", "dy_number")
);

CREATE TABLE "budget_neutrality_workbook_hypothetical_year" (
    "workbook_id" UUID NOT NULL,
    "hypothetical_id" TEXT NOT NULL,
    "dy_number" INTEGER NOT NULL,
    "cap_needed" BOOLEAN,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "budget_neutrality_workbook_hypothetical_year_pkey" PRIMARY KEY ("workbook_id", "hypothetical_id", "dy_number")
);

CREATE TABLE "budget_neutrality_workbook_spending_limit" (
    "workbook_id" UUID NOT NULL,
    "program_index" INTEGER NOT NULL,
    "program_name" TEXT NOT NULL,
    "cap_total" DECIMAL(18,2),
    "variance_total" DECIMAL(18,2),
    "over_cap" BOOLEAN,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "budget_neutrality_workbook_spending_limit_pkey" PRIMARY KEY ("workbook_id", "program_index")
);

CREATE TABLE "budget_neutrality_workbook_spending_limit_meg" (
    "workbook_id" UUID NOT NULL,
    "program_index" INTEGER NOT NULL,
    "line_number" INTEGER NOT NULL,
    "meg_name" TEXT NOT NULL,
    "subject_to_cap_total" DECIMAL(18,2),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "budget_neutrality_workbook_spending_limit_meg_pkey" PRIMARY KEY ("workbook_id", "program_index", "line_number")
);

ALTER TABLE "budget_neutrality_workbook_hypothetical_value"
    ADD CONSTRAINT "bn_workbook_hypothetical_value_parent_fkey"
    FOREIGN KEY ("workbook_id") REFERENCES "budget_neutrality_workbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "budget_neutrality_workbook_hypothetical_value"
    ADD CONSTRAINT "bn_workbook_hypothetical_value_hyp_fkey"
    FOREIGN KEY ("hypothetical_id") REFERENCES "budget_neutrality_hypothetical"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "budget_neutrality_workbook_hypothetical_value"
    ADD CONSTRAINT "bn_workbook_hypothetical_value_measure_fkey"
    FOREIGN KEY ("measure_id") REFERENCES "budget_neutrality_measure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "budget_neutrality_workbook_hypothetical_year"
    ADD CONSTRAINT "bn_workbook_hypothetical_year_parent_fkey"
    FOREIGN KEY ("workbook_id") REFERENCES "budget_neutrality_workbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "budget_neutrality_workbook_hypothetical_year"
    ADD CONSTRAINT "bn_workbook_hypothetical_year_hyp_fkey"
    FOREIGN KEY ("hypothetical_id") REFERENCES "budget_neutrality_hypothetical"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "budget_neutrality_workbook_spending_limit"
    ADD CONSTRAINT "budget_neutrality_workbook_spending_limit_workbook_id_fkey"
    FOREIGN KEY ("workbook_id") REFERENCES "budget_neutrality_workbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "budget_neutrality_workbook_spending_limit_meg"
    ADD CONSTRAINT "bn_workbook_spending_limit_meg_parent_fkey"
    FOREIGN KEY ("workbook_id", "program_index")
    REFERENCES "budget_neutrality_workbook_spending_limit"("workbook_id", "program_index") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
