ALTER TABLE "division_settings"
ADD COLUMN "warn_msg_level1" TEXT,
ADD COLUMN "warn_msg_level2" TEXT,
ADD COLUMN "warn_msg_interview" TEXT,
ADD COLUMN "warn_msg_withdraw" TEXT;

ALTER TABLE "announcements"
ADD COLUMN "published_at" TIMESTAMP(3);

CREATE INDEX "announcements_published_at_idx" ON "announcements"("published_at");
