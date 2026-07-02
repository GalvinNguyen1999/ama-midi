-- CreateEnum
CREATE TYPE "NoteEventType" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateTable
CREATE TABLE "songs" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "bpm" INTEGER NOT NULL DEFAULT 120,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "songs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" UUID NOT NULL,
    "songId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "track" SMALLINT NOT NULL,
    "time" DECIMAL(6,3) NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#7c3aed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note_events" (
    "id" BIGSERIAL NOT NULL,
    "songId" UUID NOT NULL,
    "noteId" UUID,
    "type" "NoteEventType" NOT NULL,
    "payload" JSONB NOT NULL,
    "actor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "note_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notes_songId_idx" ON "notes"("songId");

-- CreateIndex
CREATE UNIQUE INDEX "notes_songId_track_time_key" ON "notes"("songId", "track", "time");

-- CreateIndex
CREATE INDEX "note_events_songId_id_idx" ON "note_events"("songId", "id");

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_events" ADD CONSTRAINT "note_events_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
