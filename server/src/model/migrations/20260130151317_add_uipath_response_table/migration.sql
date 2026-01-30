-- CreateTable
CREATE TABLE "uipath_result" (
    "id" UUID NOT NULL,
    "request_id" TEXT NOT NULL,
    "response" JSONB NOT NULL,

    CONSTRAINT "uipath_result_pkey" PRIMARY KEY ("id")
);
