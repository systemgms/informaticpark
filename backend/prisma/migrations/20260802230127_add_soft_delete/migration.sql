-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Custodian" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Asset_isDeleted_idx" ON "Asset"("isDeleted");

-- CreateIndex
CREATE INDEX "Custodian_isDeleted_idx" ON "Custodian"("isDeleted");

-- CreateIndex
CREATE INDEX "Location_isDeleted_idx" ON "Location"("isDeleted");
