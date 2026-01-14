-- CreateTable
CREATE TABLE "application_tag_assignment" (
    "application_id" UUID NOT NULL,
    "tag_id" TEXT NOT NULL,
    "tag_type_id" TEXT NOT NULL,

    CONSTRAINT "application_tag_assignment_pkey" PRIMARY KEY ("application_id","tag_id")
);

-- CreateTable
CREATE TABLE "application_tag_assignment_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "application_id" UUID NOT NULL,
    "tag_id" TEXT NOT NULL,
    "tag_type_id" TEXT NOT NULL,

    CONSTRAINT "application_tag_assignment_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "application_tag_type_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "application_tag_type_limit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demonstration_type_tag_assignment" (
    "demonstration_id" UUID NOT NULL,
    "tag_id" TEXT NOT NULL,
    "tag_type_id" TEXT NOT NULL,
    "effective_date" TIMESTAMPTZ NOT NULL,
    "expiration_date" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "demonstration_type_tag_assignment_pkey" PRIMARY KEY ("demonstration_id","tag_id")
);

-- CreateTable
CREATE TABLE "demonstration_type_tag_assignment_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "demonstration_id" UUID NOT NULL,
    "tag_id" TEXT NOT NULL,
    "tag_type_id" TEXT NOT NULL,
    "effective_date" TIMESTAMPTZ NOT NULL,
    "expiration_date" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "demonstration_type_tag_assignment_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "demonstration_type_tag_type_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "demonstration_type_tag_type_limit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tag_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "tag_configuration" (
    "tag_id" TEXT NOT NULL,
    "tag_type_id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "status_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tag_configuration_pkey" PRIMARY KEY ("tag_id","tag_type_id")
);

-- CreateTable
CREATE TABLE "tag_configuration_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tag_id" TEXT NOT NULL,
    "tag_type_id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "status_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tag_configuration_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "tag_configuration_source" (
    "id" TEXT NOT NULL,

    CONSTRAINT "tag_configuration_source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag_configuration_status" (
    "id" TEXT NOT NULL,

    CONSTRAINT "tag_configuration_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag_type" (
    "id" TEXT NOT NULL,

    CONSTRAINT "tag_type_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "application_tag_assignment" ADD CONSTRAINT "application_tag_assignment_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_tag_assignment" ADD CONSTRAINT "application_tag_assignment_tag_id_tag_type_id_fkey" FOREIGN KEY ("tag_id", "tag_type_id") REFERENCES "tag_configuration"("tag_id", "tag_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_tag_assignment" ADD CONSTRAINT "application_tag_assignment_tag_type_id_fkey" FOREIGN KEY ("tag_type_id") REFERENCES "application_tag_type_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_tag_type_limit" ADD CONSTRAINT "application_tag_type_limit_id_fkey" FOREIGN KEY ("id") REFERENCES "tag_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration_type_tag_assignment" ADD CONSTRAINT "demonstration_type_tag_assignment_demonstration_id_fkey" FOREIGN KEY ("demonstration_id") REFERENCES "demonstration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration_type_tag_assignment" ADD CONSTRAINT "demonstration_type_tag_assignment_tag_id_tag_type_id_fkey" FOREIGN KEY ("tag_id", "tag_type_id") REFERENCES "tag_configuration"("tag_id", "tag_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration_type_tag_assignment" ADD CONSTRAINT "demonstration_type_tag_assignment_tag_type_id_fkey" FOREIGN KEY ("tag_type_id") REFERENCES "demonstration_type_tag_type_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration_type_tag_type_limit" ADD CONSTRAINT "demonstration_type_tag_type_limit_id_fkey" FOREIGN KEY ("id") REFERENCES "tag_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_configuration" ADD CONSTRAINT "tag_configuration_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_configuration" ADD CONSTRAINT "tag_configuration_tag_type_id_fkey" FOREIGN KEY ("tag_type_id") REFERENCES "tag_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_configuration" ADD CONSTRAINT "tag_configuration_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "tag_configuration_source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_configuration" ADD CONSTRAINT "tag_configuration_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "tag_configuration_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
