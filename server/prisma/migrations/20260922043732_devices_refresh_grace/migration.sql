-- AlterTable
ALTER TABLE "Devices" ADD COLUMN     "prevHashedRefreshToken" TEXT,
ADD COLUMN     "prevTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "prevTokenUsed" BOOLEAN NOT NULL DEFAULT false;
