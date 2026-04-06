ALTER TABLE "Embedding"
ADD CONSTRAINT "Embedding_sourceType_sourceId_key" UNIQUE ("sourceType", "sourceId");
