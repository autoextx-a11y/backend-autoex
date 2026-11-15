DELETE FROM "Car";

/*
  Warnings:

  - Added the required column `dealerId` to the `Car` table without a default value. This is not possible if the table is not empty.

*/


-- AlterTable

ALTER TABLE "Car" ADD COLUMN     "certified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "condition" TEXT,
ADD COLUMN     "dealerId" INTEGER NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "equipment" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "odometer" INTEGER,
ADD COLUMN     "photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "photosUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "stockNumber" TEXT,
ADD COLUMN     "vdpUrl" TEXT,
ALTER COLUMN "price" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Dealer" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "phone" TEXT,

    CONSTRAINT "Dealer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportRun" (
    "id" SERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "rowsRead" INTEGER NOT NULL DEFAULT 0,
    "rowsSkipped" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,

    CONSTRAINT "ImportRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Car_isActive_idx" ON "Car"("isActive");

-- AddForeignKey
ALTER TABLE "Car" ADD CONSTRAINT "Car_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
