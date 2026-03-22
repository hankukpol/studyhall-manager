ALTER TABLE "division_settings"
ADD COLUMN "assistant_past_edit_allowed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "assistant_past_edit_days" INTEGER NOT NULL DEFAULT 0;
