CREATE TABLE "payment_categories" (
  "id" TEXT NOT NULL,
  "division_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "payment_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payment_categories_division_id_name_key"
ON "payment_categories"("division_id", "name");

CREATE INDEX "payment_categories_division_id_idx"
ON "payment_categories"("division_id");

ALTER TABLE "payment_categories"
ADD CONSTRAINT "payment_categories_division_id_fkey"
FOREIGN KEY ("division_id") REFERENCES "divisions"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "payment_categories" ("id", "division_id", "name", "display_order")
SELECT
  'paycat_' || substr(md5(d.id || ':' || t.code), 1, 24),
  d.id,
  t.name,
  t.display_order
FROM "divisions" d
CROSS JOIN (
  VALUES
    ('ENROLLMENT', '등록비', 0),
    ('MONTHLY', '월납부', 1),
    ('REFUND', '환불', 2)
) AS t(code, name, display_order)
ON CONFLICT ("division_id", "name") DO NOTHING;

ALTER TABLE "payments"
ADD COLUMN "payment_type_id" TEXT;

UPDATE "payments" p
SET "payment_type_id" = pc."id"
FROM "students" s
JOIN "payment_categories" pc
  ON pc."division_id" = s."division_id"
 AND pc."name" = CASE p."type"
   WHEN 'ENROLLMENT'::"PaymentType" THEN '등록비'
   WHEN 'MONTHLY'::"PaymentType" THEN '월납부'
   WHEN 'REFUND'::"PaymentType" THEN '환불'
 END
WHERE p."student_id" = s."id";

ALTER TABLE "payments"
ALTER COLUMN "payment_type_id" SET NOT NULL;

CREATE INDEX "payments_payment_type_id_idx"
ON "payments"("payment_type_id");

ALTER TABLE "payments"
ADD CONSTRAINT "payments_payment_type_id_fkey"
FOREIGN KEY ("payment_type_id") REFERENCES "payment_categories"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payments"
DROP COLUMN "type";

DROP TYPE "PaymentType";
