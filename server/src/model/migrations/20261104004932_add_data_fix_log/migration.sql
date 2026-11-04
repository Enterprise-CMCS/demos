-- CreateTable
CREATE TABLE "data_fix_log" (
    "file_name" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "ticket" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "rows_affected" INTEGER NOT NULL,
    "reverses" TEXT,
    "git_commit" TEXT NOT NULL,
    "applied_by" TEXT NOT NULL,
    "approved_by" TEXT NOT NULL,
    "build_url" TEXT NOT NULL,
    "applied_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_fix_log_pkey" PRIMARY KEY ("file_name")
);

-- AddForeignKey
ALTER TABLE "data_fix_log" ADD CONSTRAINT "data_fix_log_reverses_fkey" FOREIGN KEY ("reverses") REFERENCES "data_fix_log"("file_name") ON DELETE NO ACTION ON UPDATE CASCADE;
