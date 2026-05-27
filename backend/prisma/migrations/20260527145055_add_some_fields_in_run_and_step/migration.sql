/*
  Warnings:

  - Added the required column `updatedAt` to the `Run` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Run" ADD COLUMN     "totalMs" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'running';

-- AlterTable
ALTER TABLE "Step" ADD COLUMN     "message" TEXT,
ADD COLUMN     "stack" TEXT;
