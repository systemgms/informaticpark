-- CreateIndex
CREATE INDEX "AssetMovement_fromCustodianId_idx" ON "AssetMovement"("fromCustodianId");

-- CreateIndex
CREATE INDEX "AssetMovement_fromLocationId_idx" ON "AssetMovement"("fromLocationId");

-- CreateIndex
CREATE INDEX "AssetMovement_toLocationId_idx" ON "AssetMovement"("toLocationId");

-- CreateIndex
CREATE INDEX "AssetMovement_registeredByUserId_idx" ON "AssetMovement"("registeredByUserId");

-- CreateIndex
CREATE INDEX "AssetMovement_confirmedByUserId_idx" ON "AssetMovement"("confirmedByUserId");

-- CreateIndex
CREATE INDEX "AssetMovement_groupId_status_idx" ON "AssetMovement"("groupId", "status");
