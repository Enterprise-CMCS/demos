-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR');

-- CreateTable
CREATE TABLE "event" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "event_type_id" TEXT NOT NULL,
    "with_role_id" UUID,
    "route" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event_data" JSON NOT NULL,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_type" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "log_level" "LogLevel" NOT NULL,

    CONSTRAINT "event_type_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_event_type_id_fkey" FOREIGN KEY ("event_type_id") REFERENCES "event_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_with_role_id_fkey" FOREIGN KEY ("with_role_id") REFERENCES "role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Insert initial event types
INSERT INTO "event_type" ("id", "description", "log_level") VALUES
  ('LOGIN_ATTEMPTED', 'User attempted to login to the system', 'INFO'),
  ('LOGOUT_ATTEMPTED', 'User attempted to logout of the system', 'INFO'),
  ('CREATE_DEMONSTRATION_MODAL_OPENED', 'User opened the create demonstration modal', 'INFO'),
  ('EDIT_DEMONSTRATION_ATTEMPTED', 'User edited a demonstration', 'INFO');
