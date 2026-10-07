/**
 * Clear incidents from MongoDB.
 *
 * Usage:
 *   node scripts/clear-incidents.js            # delete all
 *   node scripts/clear-incidents.js resolved   # only resolved
 *   node scripts/clear-incidents.js non-critical # only non-critical
 *   node scripts/clear-incidents.js unresolved # only unresolved
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function main() {
  const mode = process.argv[2] || 'all';

  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const Incident = require('../src/models/Incident');

  let query = {};
  if (mode === 'non-critical') {
    query = { severity: { $ne: 'critical' } };
  } else if (mode === 'unresolved') {
    query = { status: { $ne: 'resolved' } };
  } else if (mode === 'resolved') {
    query = { status: 'resolved' };
  } else if (mode === 'all') {
    query = {};
  } else {
    console.error(`Unknown mode: ${mode}`);
    console.error('Valid modes: all, non-critical, unresolved, resolved');
    process.exit(1);
  }

  const count = await Incident.countDocuments(query);
  console.log(`Found ${count} incidents matching ${JSON.stringify(query)}`);

  if (count === 0) {
    console.log('Nothing to delete');
    await mongoose.disconnect();
    process.exit(0);
  }

  const result = await Incident.deleteMany(query);
  console.log(`✓ Deleted ${result.deletedCount} incidents`);

  const remaining = await Incident.countDocuments({});
  console.log(`Remaining incidents in DB: ${remaining}`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});