-- CreateTable
CREATE TABLE "document_understanding_questions" (
    "id" UUID NOT NULL,
    "question" JSON NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "document_understanding_questions_pkey" PRIMARY KEY ("id")
);
