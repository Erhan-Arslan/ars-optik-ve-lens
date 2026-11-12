-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "lensIndexId" TEXT,
ADD COLUMN     "prescriptionOdAxis" INTEGER,
ADD COLUMN     "prescriptionOdCylinder" DECIMAL(4,2),
ADD COLUMN     "prescriptionOsAxis" INTEGER,
ADD COLUMN     "prescriptionOsCylinder" DECIMAL(4,2),
ADD COLUMN     "prescriptionPupillaryDistance" DECIMAL(4,1);

-- CreateTable
CREATE TABLE "lens_indexes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "refractiveIndex" DECIMAL(3,2) NOT NULL,
    "priceModifier" DECIMAL(10,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "lens_indexes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lens_indexes_code_key" ON "lens_indexes"("code");

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_lensIndexId_fkey" FOREIGN KEY ("lensIndexId") REFERENCES "lens_indexes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
