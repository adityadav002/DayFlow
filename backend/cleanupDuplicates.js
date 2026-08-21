const mongoose = require('mongoose');
require('dotenv').config();

const Conversation = require('./src/models/Conversation');
const Message = require('./src/models/Message');

const dryRun = process.argv.includes('--execute') ? false : true;

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`Connected to MongoDB. Dry run: ${dryRun}`);

    const directConvs = await Conversation.find({ type: 'direct' });
    const convGroups = {};

    for (const conv of directConvs) {
      // Create a stable key from participant IDs
      const participantsStr = conv.participants
        .map(p => p.toString())
        .sort()
        .join('_');
      
      if (!convGroups[participantsStr]) {
        convGroups[participantsStr] = [];
      }
      convGroups[participantsStr].push(conv);
    }

    let deletedCount = 0;

    for (const key in convGroups) {
      const convs = convGroups[key];
      if (convs.length > 1) {
        console.log(`\nFound ${convs.length} duplicates for participants: ${key}`);
        
        // Sort by lastMessageAt (descending) or createdAt (descending) to keep the most active/recent one
        convs.sort((a, b) => {
          const aTime = a.lastMessageAt || a.createdAt;
          const bTime = b.lastMessageAt || b.createdAt;
          return new Date(bTime) - new Date(aTime);
        });

        const canonicalConv = convs[0];
        const duplicates = convs.slice(1);

        console.log(`Keeping canonical conversation: ${canonicalConv._id}`);

        for (const duplicate of duplicates) {
          console.log(`- Merging messages from duplicate: ${duplicate._id}`);
          if (!dryRun) {
            // Reassign messages to canonical conversation
            await Message.updateMany(
              { conversation: duplicate._id },
              { $set: { conversation: canonicalConv._id } }
            );
            // Delete duplicate conversation
            await Conversation.findByIdAndDelete(duplicate._id);
            deletedCount++;
          }
        }
      }
    }

    if (dryRun) {
      console.log(`\nDry run complete. Found ${Object.values(convGroups).filter(g => g.length > 1).length} pairs with duplicates. Would delete ${Object.values(convGroups).reduce((acc, g) => acc + (g.length > 1 ? g.length - 1 : 0), 0)} duplicate records.`);
    } else {
      console.log(`\nCleanup complete. Reassigned messages and deleted ${deletedCount} duplicate conversation records.`);
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
  }
}

cleanup();
