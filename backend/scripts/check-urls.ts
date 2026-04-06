import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI!).then(async () => {
  const docs = await mongoose.connection.db!
    .collection('financialrecords')
    .find({ attachmentUrl: { $exists: true, $ne: null } })
    .toArray();
  
  console.log(`Total records with attachments: ${docs.length}`);
  docs.forEach(d => {
    console.log('Title:', d.title);
    console.log('URL:', d.attachmentUrl);
    console.log('---');
  });
  await mongoose.disconnect();
});
