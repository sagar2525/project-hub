import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { OpenAIEmbeddings } from '@langchain/openai';

const sampleTitles = [
  'Fix login bug',
  'Authentication error on signin',
  'Update payment UI',
  'Payment gateway timeout issue',
  'Redesign onboarding screen',
];

function loadDotEnvFile(): void {
  const envPath = join(process.cwd(), '.env');

  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, '');

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, value, index) => sum + value * b[index], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

async function main(): Promise<void> {
  loadDotEnvFile();

  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      'OPENAI_API_KEY is missing. Add it to apps/api/.env before running embeddings:test.',
    );
  }

  const embeddings = new OpenAIEmbeddings({
    model: 'text-embedding-3-small',
    apiKey: process.env.OPENAI_API_KEY,
  });

  console.log('Generating embeddings with text-embedding-3-small...\n');

  const vectors = await embeddings.embedDocuments(sampleTitles);

  sampleTitles.forEach((title, index) => {
    const preview = vectors[index].slice(0, 6).map((value) => value.toFixed(4));
    console.log(`${index + 1}. ${title}`);
    console.log(`   vector length: ${vectors[index].length}`);
    console.log(`   preview: [${preview.join(', ')}]\n`);
  });

  console.log('Cosine similarity checks:\n');

  const pairs: Array<[number, number]> = [
    [0, 1],
    [0, 2],
    [2, 3],
    [1, 4],
  ];

  for (const [left, right] of pairs) {
    const score = cosineSimilarity(vectors[left], vectors[right]);
    console.log(
      `"${sampleTitles[left]}" <-> "${sampleTitles[right]}" = ${score.toFixed(4)}`,
    );
  }

  console.log('\nExpected pattern: authentication/login titles should be closer to each other than to unrelated UI work.');
}

main().catch((error: unknown) => {
  console.error('\nEmbedding test failed.');
  console.error(error);
  process.exit(1);
});
