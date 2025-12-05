-- Normally I would put the Prisma-generated stuff in the first migration
-- Then do a second to add the custom entries
-- However, in this case that causes issues because we're adding a constraint to an existing table
-- So, we create the table, add the data, then add the constraint, which should avoid the problem

-- CreateTable
CREATE TABLE "phase_phase_status" (
    "phase_id" TEXT NOT NULL,
    "phase_status_id" TEXT NOT NULL,

    CONSTRAINT "phase_phase_status_pkey" PRIMARY KEY ("phase_id","phase_status_id")
);

-- Insert values
INSERT INTO
    demos_app.phase_phase_status
VALUES
    -- All phases can be Not Started except Concept (new applications begin in Started)
    ('Application Intake', 'Not Started'),
    ('Completeness', 'Not Started'),
    ('Federal Comment', 'Not Started'),
    ('SDG Preparation', 'Not Started'),
    ('Review', 'Not Started'),
    ('Approval Package', 'Not Started'),
    ('Post Approval', 'Not Started'),

    -- All phases can be Started
    ('Concept', 'Started'),
    ('Application Intake', 'Started'),
    ('Completeness', 'Started'),
    ('Federal Comment', 'Started'),
    ('SDG Preparation', 'Started'),
    ('Review', 'Started'),
    ('Approval Package', 'Started'),
    ('Post Approval', 'Started'),

    -- All phases can be Completed
    ('Concept', 'Completed'),
    ('Application Intake', 'Completed'),
    ('Completeness', 'Completed'),
    ('Federal Comment', 'Completed'),
    ('SDG Preparation', 'Completed'),
    ('Review', 'Completed'),
    ('Approval Package', 'Completed'),
    ('Post Approval', 'Completed'),

    -- Special cases
    ('Concept', 'Skipped'),
    ('Completeness', 'Incomplete');

-- AddForeignKey
ALTER TABLE "application_phase" ADD CONSTRAINT "application_phase_phase_id_phase_status_id_fkey" FOREIGN KEY ("phase_id", "phase_status_id") REFERENCES "phase_phase_status"("phase_id", "phase_status_id") ON DELETE RESTRICT ON UPDATE CASCADE;
