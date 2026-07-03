-- AlterTable
ALTER TABLE "songs" ADD COLUMN "ownerId" UUID;

-- CreateIndex
CREATE INDEX "songs_ownerId_idx" ON "songs"("ownerId");

-- AddForeignKey
ALTER TABLE "songs" ADD CONSTRAINT "songs_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "song_collaborators" (
    "songId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "song_collaborators_pkey" PRIMARY KEY ("songId","userId")
);

-- CreateIndex
CREATE INDEX "song_collaborators_userId_idx" ON "song_collaborators"("userId");

-- AddForeignKey
ALTER TABLE "song_collaborators" ADD CONSTRAINT "song_collaborators_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "song_collaborators" ADD CONSTRAINT "song_collaborators_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
