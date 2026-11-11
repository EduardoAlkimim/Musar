-- AddForeignKey
ALTER TABLE "assessment" ADD CONSTRAINT "assessment_class_subject_id_fkey" FOREIGN KEY ("class_subject_id") REFERENCES "class_subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
