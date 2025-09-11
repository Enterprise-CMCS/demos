-- CreateTable
CREATE TABLE "demos_app"."bundle_phase_date" (
    "bundle_id" UUID NOT NULL,
    "phase_id" TEXT NOT NULL,
    "date_type_id" TEXT NOT NULL,
    "date_value" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "bundle_phase_date_pkey" PRIMARY KEY ("bundle_id","phase_id","date_type_id")
);

-- CreateTable
CREATE TABLE "demos_app"."bundle_phase_date_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "demos_app"."revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bundle_id" UUID NOT NULL,
    "phase_id" TEXT NOT NULL,
    "date_type_id" TEXT NOT NULL,
    "date_value" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "bundle_phase_date_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "demos_app"."date_type" (
    "id" TEXT NOT NULL,

    CONSTRAINT "date_type_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "demos_app"."bundle_phase_date" ADD CONSTRAINT "bundle_phase_date_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "demos_app"."bundle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."bundle_phase_date" ADD CONSTRAINT "bundle_phase_date_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "demos_app"."phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."bundle_phase_date" ADD CONSTRAINT "bundle_phase_date_date_type_id_fkey" FOREIGN KEY ("date_type_id") REFERENCES "demos_app"."date_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
