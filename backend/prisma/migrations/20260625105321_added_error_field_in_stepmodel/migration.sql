-- CreateEnum
CREATE TYPE "EvalStatus" AS ENUM ('COLLECTING', 'IN_REVIEW', 'OVERDUE', 'COMPLETED', 'ARCHIVED', 'SCHEDULED', 'DRAFT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StepType" ADD VALUE 'RETRIEVAL';
ALTER TYPE "StepType" ADD VALUE 'MEMORY_READ';
ALTER TYPE "StepType" ADD VALUE 'MEMORY_WRITE';
ALTER TYPE "StepType" ADD VALUE 'AGENT_HANDOFF';
ALTER TYPE "StepType" ADD VALUE 'GUARDRAIL';
ALTER TYPE "StepType" ADD VALUE 'PLANNING';
ALTER TYPE "StepType" ADD VALUE 'LOOP_DETECTED';

-- AlterTable
ALTER TABLE "Step" ADD COLUMN     "error" TEXT,
ADD COLUMN     "state" JSONB;

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Eval" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "EvalStatus" NOT NULL DEFAULT 'DRAFT',
    "assignee" TEXT,
    "dueDate" TIMESTAMP(3),
    "agentName" TEXT,
    "criteria" JSONB,
    "score" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Eval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_key" ON "ApiKey"("key");

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Eval" ADD CONSTRAINT "Eval_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
