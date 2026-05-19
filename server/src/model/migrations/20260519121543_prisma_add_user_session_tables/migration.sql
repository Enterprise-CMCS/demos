SET search_path TO demos_app;

-- CreateTable
CREATE TABLE "user_session" (
    "user_id" UUID NOT NULL,
    "auth_time" TIMESTAMPTZ NOT NULL,
    "last_auth_event_time" TIMESTAMPTZ NOT NULL,
    "auth_event_count" INTEGER NOT NULL,

    CONSTRAINT "user_session_pkey" PRIMARY KEY ("user_id","auth_time")
);

-- AddForeignKey
ALTER TABLE "user_session" ADD CONSTRAINT "user_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
