SET search_path TO demos_app;

-- AddForeignKey
ALTER TABLE "application_tag_suggestion" ADD CONSTRAINT "application_tag_suggestion_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
