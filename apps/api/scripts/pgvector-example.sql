CREATE EXTENSION IF NOT EXISTS vector;

INSERT INTO "Embedding" (
  "id",
  "content",
  "embedding",
  "sourceType",
  "sourceId",
  "metadata"
)
VALUES (
  gen_random_uuid()::text,
  'Ticket: Fix payment gateway timeout',
  '[0.12, 0.98, 0.44]'::vector,
  'ticket',
  'ticket-id-placeholder',
  '{"projectName":"E-Commerce Platform","ticketTitle":"Fix payment gateway timeout"}'::jsonb
);

SELECT
  "id",
  "content",
  "sourceType",
  "sourceId",
  "metadata",
  ("embedding" <=> '[0.11, 0.91, 0.39]'::vector) AS distance
FROM "Embedding"
ORDER BY "embedding" <=> '[0.11, 0.91, 0.39]'::vector
LIMIT 5;
