-- CreateEnum
CREATE TYPE "AssetCondition" AS ENUM ('BUENO', 'MALO', 'EN_MANTENIMIENTO');

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "condition" "AssetCondition" NOT NULL DEFAULT 'BUENO';

-- CreateIndex
CREATE INDEX "Asset_condition_idx" ON "Asset"("condition");
