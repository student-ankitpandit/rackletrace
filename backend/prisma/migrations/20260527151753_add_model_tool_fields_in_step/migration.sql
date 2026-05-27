/*
  Warnings:

  - You are about to drop the column `APIRequest` on the `Step` table. All the data in the column will be lost.
  - You are about to drop the column `MemoryUsage` on the `Step` table. All the data in the column will be lost.
  - You are about to drop the column `executionTime` on the `Step` table. All the data in the column will be lost.
  - You are about to drop the column `reasoningStep` on the `Step` table. All the data in the column will be lost.
  - You are about to drop the column `tokensUsage` on the `Step` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Step" DROP COLUMN "APIRequest",
DROP COLUMN "MemoryUsage",
DROP COLUMN "executionTime",
DROP COLUMN "reasoningStep",
DROP COLUMN "tokensUsage",
ADD COLUMN     "model" TEXT,
ADD COLUMN     "tokens" INTEGER,
ADD COLUMN     "tool" TEXT;
