-- AlterEnum
ALTER TYPE "DataSource" ADD VALUE 'inferred';

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('unreviewed', 'approved');
CREATE TYPE "VoteOutcome" AS ENUM ('PASSED', 'FAILED');
CREATE TYPE "VoteKind" AS ENUM ('ROLL_CALL', 'VOICE');

-- AlterTable
ALTER TABLE "SubjectVote" ADD COLUMN "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'unreviewed';
ALTER TABLE "MeetingAttendance" ADD COLUMN "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'unreviewed';

-- CreateTable
CREATE TABLE "SubjectVoteResult" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subjectId" TEXT NOT NULL,
    "outcome" "VoteOutcome" NOT NULL,
    "yayCount" INTEGER NOT NULL,
    "nayCount" INTEGER NOT NULL,
    "abstainCount" INTEGER NOT NULL DEFAULT 0,
    "kind" "VoteKind" NOT NULL,
    "motionText" TEXT,
    "source" "DataSource" NOT NULL,
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'unreviewed',
    CONSTRAINT "SubjectVoteResult_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SubjectVoteResult_subjectId_key" ON "SubjectVoteResult"("subjectId");
CREATE INDEX "SubjectVoteResult_subjectId_idx" ON "SubjectVoteResult"("subjectId");

ALTER TABLE "SubjectVoteResult"
  ADD CONSTRAINT "SubjectVoteResult_subjectId_fkey"
  FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
