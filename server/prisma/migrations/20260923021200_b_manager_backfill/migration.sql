-- Har do'kondagi ENG BIRINCHI ADMIN menejerga aylanadi.
-- (Enum qiymati oldingi migratsiyada qo'shilgan: Postgres yangi enum qiymatini
--  uni qo'shgan tranzaksiyaning ichida ishlatishga ruxsat bermaydi.)
UPDATE "User"
SET "role" = 'MANAGER'
WHERE "id" IN (
  SELECT DISTINCT ON ("storeId") "id"
  FROM "User"
  WHERE "role" = 'ADMIN' AND "storeId" IS NOT NULL
  ORDER BY "storeId", "createdAt" ASC, "id" ASC
);

-- Har do'konda ko'pi bilan bitta MANAGER — baza darajasidagi kafolat.
-- Qisman unikal indeks: faqat MANAGER qatorlari uchun ishlaydi.
CREATE UNIQUE INDEX "User_storeId_manager_key"
ON "User" ("storeId")
WHERE "role" = 'MANAGER';
