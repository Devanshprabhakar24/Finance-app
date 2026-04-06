/**
 * One-time migration: remove broken /fl_inline/ from Cloudinary attachment URLs
 * Run with: npx ts-node scripts/fix-attachment-urls.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI!;

async function fixUrls() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db!;
  const collection = db.collection('financialrecords');

  // Find all records with fl_inline in the URL
  const broken = await collection.find({
    attachmentUrl: { $regex: '/fl_inline/' }
  }).toArray();

  console.log(`Found ${broken.length} records with broken attachment URLs`);

  for (const record of broken) {
    const fixedUrl = record.attachmentUrl.replace('/fl_inline/', '/');
    await collection.updateOne(
      { _id: record._id },
      { $set: { attachmentUrl: fixedUrl } }
    );
    console.log(`Fixed: ${record._id}`);
    console.log(`  Before: ${record.attachmentUrl}`);
    console.log(`  After:  ${fixedUrl}`);
  }

  console.log('Done');
  await mongoose.disconnect();
}

fixUrls().catch(console.error);
