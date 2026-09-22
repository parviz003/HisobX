-- AlterTable
ALTER TABLE "Devices" ADD COLUMN     "browser" TEXT,
ADD COLUMN     "deviceType" TEXT,
ADD COLUMN     "ip" TEXT,
ADD COLUMN     "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "os" TEXT;

-- Mavjud qurilmalar uchun lastActiveAt'ni createdAt'ga tenglashtiramiz
-- (aks holda hammasi migratsiya vaqtini ko'rsatib qolardi)
UPDATE "Devices" SET "lastActiveAt" = "createdAt";

-- ---------------------------------------------------------------------------
-- Telefon raqamlarini yagona formatga keltirish: +998901234567
-- ---------------------------------------------------------------------------
-- 1) "998901234567", "998 90 123 45 67" va h.k. -> "+998901234567"
--    Unique cheklov buzilmasligi uchun natija band bo'lmagan qatorlargina
--    yangilanadi (migratsiya hech qachon yiqilmasligi kerak).
UPDATE "User" u
SET "phone" = '+' || regexp_replace(u."phone", '\D', '', 'g')
WHERE regexp_replace(u."phone", '\D', '', 'g') ~ '^998[0-9]{9}$'
  AND u."phone" <> '+' || regexp_replace(u."phone", '\D', '', 'g')
  AND NOT EXISTS (
    SELECT 1 FROM "User" x
    WHERE x."phone" = '+' || regexp_replace(u."phone", '\D', '', 'g')
  );

-- 2) Mamlakat kodisiz kiritilgan "901234567" -> "+998901234567"
UPDATE "User" u
SET "phone" = '+998' || regexp_replace(u."phone", '\D', '', 'g')
WHERE regexp_replace(u."phone", '\D', '', 'g') ~ '^[0-9]{9}$'
  AND NOT EXISTS (
    SELECT 1 FROM "User" x
    WHERE x."phone" = '+998' || regexp_replace(u."phone", '\D', '', 'g')
  );

-- 3) Do'kon telefoni (unique emas)
UPDATE "Store"
SET "phone" = '+' || regexp_replace("phone", '\D', '', 'g')
WHERE "phone" IS NOT NULL
  AND regexp_replace("phone", '\D', '', 'g') ~ '^998[0-9]{9}$'
  AND "phone" <> '+' || regexp_replace("phone", '\D', '', 'g');

UPDATE "Store"
SET "phone" = '+998' || regexp_replace("phone", '\D', '', 'g')
WHERE "phone" IS NOT NULL
  AND regexp_replace("phone", '\D', '', 'g') ~ '^[0-9]{9}$';

-- 4) Mijoz telefoni (unique emas)
UPDATE "Customer"
SET "phone" = '+' || regexp_replace("phone", '\D', '', 'g')
WHERE "phone" IS NOT NULL
  AND regexp_replace("phone", '\D', '', 'g') ~ '^998[0-9]{9}$'
  AND "phone" <> '+' || regexp_replace("phone", '\D', '', 'g');

UPDATE "Customer"
SET "phone" = '+998' || regexp_replace("phone", '\D', '', 'g')
WHERE "phone" IS NOT NULL
  AND regexp_replace("phone", '\D', '', 'g') ~ '^[0-9]{9}$';
