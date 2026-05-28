SET search_path TO demos_app;

-- CreateTable
CREATE TABLE "reference" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "s3_path" TEXT NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "reference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reference_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "s3_path" TEXT NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "reference_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "reference_agreement" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "s3_path" TEXT NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "reference_agreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reference_agreement_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "s3_path" TEXT NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "reference_agreement_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "reference_agreement_acceptance" (
    "reference_id" UUID NOT NULL,
    "reference_agreement_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "acceptance_timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reference_agreement_acceptance_pkey" PRIMARY KEY ("reference_id","reference_agreement_id","user_id")
);

-- CreateTable
CREATE TABLE "reference_configuration" (
    "id" UUID NOT NULL,
    "reference_id" UUID NOT NULL,
    "reference_agreement_id" UUID,
    "status_id" TEXT NOT NULL,

    CONSTRAINT "reference_configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reference_configuration_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "reference_id" UUID NOT NULL,
    "reference_agreement_id" UUID,
    "status_id" TEXT NOT NULL,

    CONSTRAINT "reference_configuration_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "reference_configuration_status" (
    "id" TEXT NOT NULL,

    CONSTRAINT "reference_configuration_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reference_demonstration_type" (
    "reference_id" UUID NOT NULL,
    "demonstration_type_tag_name_id" TEXT NOT NULL,
    "demonstration_type_tag_type_id" TEXT NOT NULL,

    CONSTRAINT "reference_demonstration_type_pkey" PRIMARY KEY ("reference_id","demonstration_type_tag_name_id","demonstration_type_tag_type_id")
);

-- CreateTable
CREATE TABLE "reference_demonstration_type_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference_id" UUID NOT NULL,
    "demonstration_type_tag_name_id" TEXT NOT NULL,
    "demonstration_type_tag_type_id" TEXT NOT NULL,

    CONSTRAINT "reference_demonstration_type_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "reference_tag_assignment" (
    "reference_id" UUID NOT NULL,
    "tag_name_id" TEXT NOT NULL,
    "tag_type_id" TEXT NOT NULL,

    CONSTRAINT "reference_tag_assignment_pkey" PRIMARY KEY ("reference_id","tag_name_id","tag_type_id")
);

-- CreateTable
CREATE TABLE "reference_tag_assignment_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference_id" UUID NOT NULL,
    "tag_name_id" TEXT NOT NULL,
    "tag_type_id" TEXT NOT NULL,

    CONSTRAINT "reference_tag_assignment_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "reference_tag_type_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "reference_tag_type_limit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
-- Customized with NULLS NOT DISTINCT
CREATE UNIQUE INDEX reference_configuration_reference_id_reference_agreement_id_key
ON demos_app.reference_configuration (reference_id, reference_agreement_id)
NULLS NOT DISTINCT;

-- Partial unique index, customized
CREATE UNIQUE INDEX reference_configuration_unique_index_on_active_reference_id
ON demos_app.reference_configuration (reference_id)
WHERE
    status_id = 'Active';

-- AddForeignKey
ALTER TABLE "reference" ADD CONSTRAINT "reference_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference_agreement" ADD CONSTRAINT "reference_agreement_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference_agreement_acceptance" ADD CONSTRAINT "reference_agreement_acceptance_reference_id_reference_agre_fkey" FOREIGN KEY ("reference_id", "reference_agreement_id") REFERENCES "reference_configuration"("reference_id", "reference_agreement_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reference_agreement_acceptance" ADD CONSTRAINT "reference_agreement_acceptance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference_configuration" ADD CONSTRAINT "reference_configuration_reference_id_fkey" FOREIGN KEY ("reference_id") REFERENCES "reference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference_configuration" ADD CONSTRAINT "reference_configuration_reference_agreement_id_fkey" FOREIGN KEY ("reference_agreement_id") REFERENCES "reference_agreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference_configuration" ADD CONSTRAINT "reference_configuration_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "reference_configuration_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference_demonstration_type" ADD CONSTRAINT "reference_demonstration_type_reference_id_fkey" FOREIGN KEY ("reference_id") REFERENCES "reference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference_demonstration_type" ADD CONSTRAINT "reference_demonstration_type_demonstration_type_tag_name_i_fkey" FOREIGN KEY ("demonstration_type_tag_name_id", "demonstration_type_tag_type_id") REFERENCES "tag"("tag_name_id", "tag_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference_demonstration_type" ADD CONSTRAINT "reference_demonstration_type_demonstration_type_tag_type_i_fkey" FOREIGN KEY ("demonstration_type_tag_type_id") REFERENCES "demonstration_type_tag_type_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference_tag_assignment" ADD CONSTRAINT "reference_tag_assignment_reference_id_fkey" FOREIGN KEY ("reference_id") REFERENCES "reference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference_tag_assignment" ADD CONSTRAINT "reference_tag_assignment_tag_name_id_tag_type_id_fkey" FOREIGN KEY ("tag_name_id", "tag_type_id") REFERENCES "tag"("tag_name_id", "tag_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference_tag_assignment" ADD CONSTRAINT "reference_tag_assignment_tag_type_id_fkey" FOREIGN KEY ("tag_type_id") REFERENCES "reference_tag_type_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference_tag_type_limit" ADD CONSTRAINT "reference_tag_type_limit_id_fkey" FOREIGN KEY ("id") REFERENCES "tag_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
