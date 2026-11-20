-- CreateTable
CREATE TABLE "data_fix_log" (
    "file_name" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "ticket" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "rows_affected" INTEGER NOT NULL,
    "reverse_file" TEXT,
    "reverses" TEXT,
    "git_commit" TEXT NOT NULL,
    "applied_by" TEXT NOT NULL,
    "approved_by" TEXT NOT NULL,
    "build_url" TEXT NOT NULL,
    "applied_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_fix_log_pkey" PRIMARY KEY ("file_name")
);

-- CreateIndex
CREATE UNIQUE INDEX "data_fix_log_reverse_file_key" ON "data_fix_log"("reverse_file");

-- CreateIndex
CREATE UNIQUE INDEX "data_fix_log_reverses_key" ON "data_fix_log"("reverses");

-- CreateIndex
CREATE UNIQUE INDEX "data_fix_log_file_name_reverse_file_key" ON "data_fix_log"("file_name", "reverse_file");

-- CreateIndex
CREATE UNIQUE INDEX "data_fix_log_reverses_file_name_key" ON "data_fix_log"("reverses", "file_name");

-- AddCheckConstraint
ALTER TABLE "data_fix_log" ADD CONSTRAINT "data_fix_log_forward_or_reversal_check" CHECK (("reverse_file" IS NULL) <> ("reverses" IS NULL));

-- AddForeignKey
ALTER TABLE "data_fix_log" ADD CONSTRAINT "data_fix_log_reverses_file_name_fkey" FOREIGN KEY ("reverses", "file_name") REFERENCES "data_fix_log"("file_name", "reverse_file") ON DELETE NO ACTION ON UPDATE NO ACTION;
