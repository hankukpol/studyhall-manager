ALTER TABLE "students"
ADD COLUMN "study_track" TEXT;

ALTER TABLE "division_settings"
ADD COLUMN "study_tracks" JSONB NOT NULL DEFAULT '[]';
