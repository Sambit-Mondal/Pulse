// ============================================================================
// Database Seed Script
// Orchestrates: CSV → Preprocess → Vectorize → Bulk Insert to MongoDB
// Run with: npx tsx src/scripts/seed.ts
// ============================================================================

import { config } from 'dotenv';
config();

import { connectToDatabase } from '../lib/db/connection';
import EventModel from '../lib/db/models/event';
import { preprocessDataset } from '../lib/pipeline/preprocessor';
import { generateEmbedding } from '../lib/pipeline/vectorizer';
import type { EventDocument, GeoJSONPoint } from '../lib/types';

const BATCH_SIZE = 500;

async function seed(): Promise<void> {
  console.log('='.repeat(60));
  console.log('  PULSE — Database Seed Script');
  console.log('='.repeat(60));
  console.log('');

  // Step 1: Connect to MongoDB
  console.log('[Seed] Step 1/4: Connecting to MongoDB...');
  await connectToDatabase();
  console.log('[Seed] Connected.\n');

  // Step 2: Preprocess the dataset
  console.log('[Seed] Step 2/4: Preprocessing dataset...');
  const processedEvents = preprocessDataset();
  console.log(`[Seed] Preprocessed ${processedEvents.length} events.\n`);

  // Step 3: Generate embeddings and build documents
  console.log('[Seed] Step 3/4: Generating embeddings...');
  const documents: Omit<EventDocument, keyof Document>[] = processedEvents.map((event) => {
    const embedding = generateEmbedding(event);
    const location: GeoJSONPoint = {
      type: 'Point',
      coordinates: [event.longitude, event.latitude], // GeoJSON is [lng, lat]
    };

    return {
      ...event,
      location,
      embedding,
    };
  });
  console.log(`[Seed] Built ${documents.length} documents with embeddings.\n`);

  // Step 4: Bulk upsert into MongoDB
  console.log('[Seed] Step 4/4: Inserting into MongoDB...');

  // Clear existing data
  const deleteResult = await EventModel.deleteMany({});
  console.log(`[Seed] Cleared ${deleteResult.deletedCount} existing documents.`);

  let insertedCount = 0;
  const totalBatches = Math.ceil(documents.length / BATCH_SIZE);

  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    try {
      const result = await EventModel.insertMany(batch, { ordered: false });
      insertedCount += result.length;
      console.log(`[Seed] Batch ${batchNum}/${totalBatches}: Inserted ${result.length} documents`);
    } catch (error: unknown) {
      // Handle duplicate key errors gracefully
      if (error && typeof error === 'object' && 'insertedDocs' in error) {
        const bulkError = error as { insertedDocs: unknown[] };
        insertedCount += bulkError.insertedDocs.length;
        console.warn(`[Seed] Batch ${batchNum}/${totalBatches}: Partial insert (duplicates skipped)`);
      } else {
        console.error(`[Seed] Batch ${batchNum}/${totalBatches}: Error:`, error);
      }
    }
  }

  // Ensure indexes are created
  console.log('[Seed] Ensuring indexes...');
  await EventModel.ensureIndexes();

  console.log('');
  console.log('='.repeat(60));
  console.log(`  SEED COMPLETE: ${insertedCount} events loaded`);
  console.log('='.repeat(60));

  process.exit(0);
}

seed().catch((error) => {
  console.error('[Seed] Fatal error:', error);
  process.exit(1);
});
