-- Migrate existing claims into DecisionCandidate rows (issue #617 phase 4):
-- a claim becomes an unresolved candidate proposing the claiming subject; the
-- conflict stays derivable via the ADA join to the holding Decision.
INSERT INTO "DecisionCandidate" ("id", "cityId", "ada", "pdfUrl", "readStatus", "councilMeetingId", "subjectId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), s."cityId", s."claimedAda",
       'https://diavgeia.gov.gr/doc/' || s."claimedAda",
       'unread', s."councilMeetingId", s.id, NOW(), NOW()
FROM "Subject" s
WHERE s."claimedAda" IS NOT NULL
ON CONFLICT ("cityId", "ada") DO NOTHING;

-- AlterTable
ALTER TABLE "Subject" DROP COLUMN "claimedAda";
