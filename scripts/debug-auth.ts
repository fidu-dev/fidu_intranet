/**
 * Debug script to test Airtable access validation
 * Run with: npx tsx scripts/debug-auth.ts
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') });

import { getAgencyByEmail } from '../src/lib/airtable/service';

async function testAuth() {
    console.log('=== AUTHENTICATION DEBUG ===\n');

    // Verify environment variables
    console.log('Environment Check:');
    console.log(`  - AIRTABLE_API_KEY: ${process.env.AIRTABLE_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`  - AIRTABLE_PRODUCT_BASE_ID: ${process.env.AIRTABLE_PRODUCT_BASE_ID ? '✅ Set' : '❌ Missing'}`);
    console.log(`  - CLERK_PUBLISHABLE_KEY: ${process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing'}\n`);

    if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_PRODUCT_BASE_ID) {
        console.log('❌ CRITICAL: Environment variables not loaded!');
        console.log('Make sure .env.local exists in the project root.\n');
        return;
    }

    // Test with the user's email
    const testEmail = 'rafaelhobrum@gmail.com';

    console.log(`Testing access for: ${testEmail}`);
    console.log('Fetching from Airtable...\n');

    try {
        const agency = await getAgencyByEmail(testEmail);

        if (agency) {
            console.log('✅ SUCCESS: User found in Acessos table');
            console.log('\nUser Details:');
            console.log(`  - ID: ${agency.id}`);
            console.log(`  - Name: ${agency.name}`);
            console.log(`  - Agent: ${agency.agentName}`);
            console.log(`  - Email: ${agency.email}`);
            console.log(`  - Commission: ${(agency.commissionRate * 100).toFixed(0)}%`);
            console.log(`  - Can Reserve: ${agency.canReserve}`);
            console.log(`  - Can Access Mural: ${agency.canAccessMural}`);
            console.log(`  - Is Admin: ${agency.isAdmin}`);
        } else {
            console.log('❌ FAILED: User NOT found in Acessos table');
            console.log('\nPossible reasons:');
            console.log('  1. Email not in Airtable Acessos table');
            console.log('  2. Email has different capitalization');
            console.log('  3. Email has extra whitespace');
            console.log('  4. Table structure changed');
        }
    } catch (error: any) {
        console.log('❌ ERROR during lookup:');
        console.error(error.message);
        console.error(error.stack);
    }

    console.log('\n=== END DEBUG ===');
}

testAuth();
