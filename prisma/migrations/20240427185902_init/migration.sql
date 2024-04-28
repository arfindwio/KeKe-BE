-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "promotionId" INTEGER;

-- CreateTable
CREATE TABLE "Promotion" (
    "id" SERIAL NOT NULL,
    "discount" DECIMAL(65,30) NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
