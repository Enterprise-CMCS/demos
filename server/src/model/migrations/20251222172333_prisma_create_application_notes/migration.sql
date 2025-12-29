
-- CreateTable
CREATE TABLE "application_note" (
    "application_id" UUID NOT NULL,
    "note_type_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "application_note_pkey" PRIMARY KEY ("application_id","note_type_id")
);

-- CreateTable
CREATE TABLE "note_type" (
    "id" TEXT NOT NULL,

    CONSTRAINT "note_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phase_note_type" (
    "phase_id" TEXT NOT NULL,
    "note_type_id" TEXT NOT NULL,

    CONSTRAINT "phase_note_type_pkey" PRIMARY KEY ("phase_id","note_type_id")
);

-- AddForeignKey
ALTER TABLE "application_note" ADD CONSTRAINT "application_note_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_note" ADD CONSTRAINT "application_note_note_type_id_fkey" FOREIGN KEY ("note_type_id") REFERENCES "note_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phase_note_type" ADD CONSTRAINT "phase_note_type_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phase_note_type" ADD CONSTRAINT "phase_note_type_note_type_id_fkey" FOREIGN KEY ("note_type_id") REFERENCES "note_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
