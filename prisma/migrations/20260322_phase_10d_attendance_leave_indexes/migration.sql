-- Add date-leading indexes for attendance and leave range queries
CREATE INDEX "attendance_date_student_id_idx" ON "attendance"("date", "student_id");

CREATE INDEX "leave_permissions_date_student_id_idx" ON "leave_permissions"("date", "student_id");
