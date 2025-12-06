const mongoose = require('mongoose');
require('dotenv').config();

async function checkCredentials() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;

        // Get credentials collection indexes
        const indexes = await db.collection('credentials').indexes();
        console.log('📊 Credentials collection indexes:');
        indexes.forEach(idx => {
            const keyStr = JSON.stringify(idx.key);
            console.log(`   - ${idx.name}: ${keyStr}, unique: ${idx.unique || false}`);
        });

        // Count total credentials
        const total = await db.collection('credentials').countDocuments();
        console.log(`\n📈 Total credentials: ${total}`);

        // Find any with null blockchain.credentialHash
        const nullBlockchainHash = await db.collection('credentials').find({
            'blockchain.credentialHash': null
        }).toArray();
        console.log(`\n❌ Credentials with blockchain.credentialHash=null: ${nullBlockchainHash.length}`);

        // Check for any with just credentialHash at top level
        const nullTopLevelHash = await db.collection('credentials').find({
            'credentialHash': null
        }).toArray();
        console.log(`❌ Credentials with credentialHash=null (top-level): ${nullTopLevelHash.length}`);

        // List all credentials
        const allCreds = await db.collection('credentials').find({}, {
            projection: {
                credentialId: 1,
                userId: 1,
                'blockchain.credentialHash': 1,
                credentialHash: 1,
                status: 1,
                createdAt: 1
            }
        }).toArray();

        console.log(`\n📋 All credentials:\n`);
        allCreds.forEach(cred => {
            const hash = cred.blockchain?.credentialHash || cred.credentialHash || 'NULL';
            console.log(`   ID: ${cred.credentialId || 'N/A'}, Hash: ${hash}, Status: ${cred.status}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkCredentials();
