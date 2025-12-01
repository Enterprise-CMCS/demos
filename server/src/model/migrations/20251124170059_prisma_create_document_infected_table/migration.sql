-- CreateTable
CREATE TABLE "document_infected" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "s3_path" TEXT NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "document_type_id" TEXT NOT NULL,
    "application_id" UUID NOT NULL,
    "phase_id" TEXT NOT NULL,
    "infection_status" TEXT NOT NULL,
    "infection_threats" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "document_infected_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "document_infected" ADD CONSTRAINT "document_infected_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_infected" ADD CONSTRAINT "document_infected_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_infected" ADD CONSTRAINT "document_infected_phase_id_document_type_id_fkey" FOREIGN KEY ("phase_id", "document_type_id") REFERENCES "phase_document_type"("phase_id", "document_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "document_infected_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "s3_path" TEXT NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "document_type_id" TEXT NOT NULL,
    "application_id" UUID NOT NULL,
    "phase_id" TEXT NOT NULL,
    "infection_status" TEXT NOT NULL,
    "infection_threats" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "document_infected_history_pkey" PRIMARY KEY ("revision_id")
);
