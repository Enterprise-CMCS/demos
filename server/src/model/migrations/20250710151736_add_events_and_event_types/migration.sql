-- CreateTable
CREATE TABLE "event" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "event_type_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event_data" JSON NOT NULL,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_type" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "event_type_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_event_type_id_fkey" FOREIGN KEY ("event_type_id") REFERENCES "event_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Insert standard event types
INSERT INTO "event_type" ("id", "description") VALUES
  ('LOGIN', 'User attempted to login to the system'),
  ('LOGOUT', 'User attempted to logout of the system'),
  ('CREATE_DEMONSTRATION', 'User created a demonstration'),
  ('EDIT_DEMONSTRATION', 'User edited a demonstration'),
  ('CREATE_AMENDMENT', 'User created an amendment'),
  ('EDIT_AMENDMENT', 'User edited an amendment'),
  ('CREATE_EXTENSION', 'User created an extension'),
  ('EDIT_EXTENSION', 'User edited an extension'),
  ('UPLOAD_DOCUMENT', 'User uploaded a document'),
  ('ADD_DOCUMENT', 'User added a document'),
  ('REMOVE_DOCUMENT', 'User removed a document')
