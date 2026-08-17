-- CreateTable
CREATE TABLE "AgendaObservation" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "firstObservedAt" TIMESTAMP(3) NOT NULL,
    "contentHash" TEXT NOT NULL,
    "meetingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgendaObservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgendaObservation_cityId_source_key" ON "AgendaObservation"("cityId", "source");

-- CreateIndex
CREATE INDEX "AgendaObservation_cityId_meetingId_idx" ON "AgendaObservation"("cityId", "meetingId");

-- AddForeignKey
ALTER TABLE "AgendaObservation" ADD CONSTRAINT "AgendaObservation_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;
