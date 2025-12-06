/**
 * Drop the old credentialHash_1 index that's no longer used
 * The schema now uses blockchain.credentialHash instead
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function dropOldIndex() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;

        // Drop the old credentialHash_1 index
        console.log('🗑️  Dropping old credentialHash_1 index...');

        try {
            await db.collection('credentials').dropIndex('credentialHash_1');
            console.log('✅ Successfully dropped credentialHash_1 index');
        } catch (error) {
            if (error.codeName === 'IndexNotFound') {
                console.log('ℹ️  Index credentialHash_1 not found (already dropped)');
            } else {
                throw error;
            }
        }

        // Verify indexes after drop
        const indexes = await db.collection('credentials').indexes();
        console.log('\n📊 Remaining indexes:');
        indexes.forEach(idx => {
            const keyStr = JSON.stringify(idx.key);
            if (idx.unique) {
                console.log(`   - ${idx.name}: ${keyStr} (UNIQUE)`);
            }
        });

        console.log('\n✨ Index cleanup complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

dropOldIndex();
