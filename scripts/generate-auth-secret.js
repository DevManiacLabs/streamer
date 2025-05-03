/**
 * This script generates a secure random string that can be used as NEXTAUTH_SECRET
 * Run this script using: node scripts/generate-auth-secret.js
 */

const crypto = require('crypto');

// Generate a secure random string (32 bytes = 256 bits)
const secret = crypto.randomBytes(32).toString('hex');

console.log('\n=== NextAuth Secret Key ===');
console.log(secret);
console.log('\nAdd this to your .env.local file as:');
console.log(`NEXTAUTH_SECRET=${secret}\n`); 