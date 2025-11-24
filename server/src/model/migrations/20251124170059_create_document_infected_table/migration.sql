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