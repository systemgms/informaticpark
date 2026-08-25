-- CreateIndex
CREATE INDEX "Asset_custodianId_idx" ON "Asset"("custodianId");

-- CreateIndex
CREATE INDEX "Asset_createdByUserId_idx" ON "Asset"("createdByUserId");

-- CreateIndex
CREATE INDEX "Asset_locationId_idx" ON "Asset"("locationId");

-- CreateIndex
CREATE INDEX "Asset_assetName_idx" ON "Asset"("assetName");

-- CreateIndex
CREATE INDEX "Asset_code_idx" ON "Asset"("code");

-- CreateIndex
CREATE INDEX "AssetMovement_assetId_idx" ON "AssetMovement"("assetId");

-- CreateIndex
CREATE INDEX "AssetMovement_toCustodianId_idx" ON "AssetMovement"("toCustodianId");

-- CreateIndex
CREATE INDEX "AssetMovement_status_idx" ON "AssetMovement"("status");

-- CreateIndex
CREATE INDEX "AssetMovement_groupId_idx" ON "AssetMovement"("groupId");

-- CreateIndex
CREATE INDEX "AssetMovement_createdAt_idx" ON "AssetMovement"("createdAt");

-- CreateIndex
CREATE INDEX "Custodian_fullName_idx" ON "Custodian"("fullName");

-- CreateIndex
CREATE INDEX "Location_canton_parroquia_idx" ON "Location"("canton", "parroquia");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");
