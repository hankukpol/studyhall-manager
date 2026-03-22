CREATE TABLE "tuition_plans" (
  "id" TEXT NOT NULL,
  "division_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "duration_days" INTEGER,
  "amount" INTEGER NOT NULL,
  "description" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "tuition_plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tuition_plans_division_id_name_key"
ON "tuition_plans"("division_id", "name");

CREATE INDEX "tuition_plans_division_id_idx"
ON "tuition_plans"("division_id");

ALTER TABLE "tuition_plans"
ADD CONSTRAINT "tuition_plans_division_id_fkey"
FOREIGN KEY ("division_id") REFERENCES "divisions"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "study_rooms" (
  "id" TEXT NOT NULL,
  "division_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "columns" INTEGER NOT NULL DEFAULT 9,
  "rows" INTEGER NOT NULL DEFAULT 6,
  "aisle_columns" JSONB NOT NULL DEFAULT '[]',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "study_rooms_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "study_rooms_division_id_name_key"
ON "study_rooms"("division_id", "name");

CREATE INDEX "study_rooms_division_id_idx"
ON "study_rooms"("division_id");

ALTER TABLE "study_rooms"
ADD CONSTRAINT "study_rooms_division_id_fkey"
FOREIGN KEY ("division_id") REFERENCES "divisions"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "study_rooms" (
  "id",
  "division_id",
  "name",
  "columns",
  "rows",
  "aisle_columns",
  "is_active",
  "display_order",
  "created_at",
  "updated_at"
)
SELECT
  'room-default-' || "id",
  "id",
  '기본 자습실',
  9,
  6,
  '[5]'::jsonb,
  true,
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "divisions";

ALTER TABLE "students"
ADD COLUMN "course_start_date" DATE,
ADD COLUMN "course_end_date" DATE,
ADD COLUMN "tuition_plan_id" TEXT,
ADD COLUMN "tuition_amount" INTEGER;

CREATE INDEX "students_tuition_plan_id_idx"
ON "students"("tuition_plan_id");

ALTER TABLE "students"
ADD CONSTRAINT "students_tuition_plan_id_fkey"
FOREIGN KEY ("tuition_plan_id") REFERENCES "tuition_plans"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "seats"
ADD COLUMN "study_room_id" TEXT,
ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "seats"
SET "study_room_id" = 'room-default-' || "division_id"
WHERE "study_room_id" IS NULL;

ALTER TABLE "seats"
ALTER COLUMN "study_room_id" SET NOT NULL;

CREATE INDEX "seats_study_room_id_idx"
ON "seats"("study_room_id");

CREATE UNIQUE INDEX "seats_study_room_id_position_x_position_y_key"
ON "seats"("study_room_id", "position_x", "position_y");

ALTER TABLE "seats"
ADD CONSTRAINT "seats_study_room_id_fkey"
FOREIGN KEY ("study_room_id") REFERENCES "study_rooms"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
