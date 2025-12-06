/**
 * Script to fix credentials with null credentialHash
 * This can happen if credential creation was interrupted
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Credential = require('../src/models/Credential');

async function fixNullCredentialHashes() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✅ Connected to MongoDB');

        // Find credentials with null blockchain.credentialHash
        const nullHashCredentials = await Credential.find({
            'blockchain.credentialHash': null
        });

        console.log(`\n📊 Found ${nullHashCredentials.length} credentials with null credentialHash`);

        if (nullHashCredentials.length === 0) {
            console.log('✅ No null credentialHash found. Database is clean!');
            process.exit(0);
        }

        // Display them
        for (const cred of nullHashCredentials) {
            console.log(`\n❌ Credential ID: ${cred.credentialId || 'N/A'}`);
            console.log(`   User ID: ${cred.userId}`);
            console.log(`   Status: ${cred.status}`);
            console.log(`   Created: ${cred.createdAt}`);
        }

        // Delete these corrupted credentials
        console.log(`\n🗑️  Deleting ${nullHashCredentials.length} corrupted credentials...`);

        const deleteResult = await Credential.deleteMany({
            'blockchain.credentialHash': null
        });

        console.log(`✅ Deleted ${deleteResult.deletedCount} credentials`);

        console.log('\n✨ Database cleaned successfully!');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixNullCredentialHashes();
