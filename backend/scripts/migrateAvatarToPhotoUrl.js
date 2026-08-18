import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

/**
 * One-off migration: split the overloaded `avatar` field.
 *
 * `avatar` used to hold either the OAuth profile picture URL or the cosmetic
 * emoji the user picked in Settings, so choosing an emoji silently destroyed the
 * Google photo. Provider photos now live in `photoUrl` and `avatar` is emoji-only.
 *
 * For every user whose `avatar` is a URL: copy it to `photoUrl` (unless one is
 * already set — Passport refreshes that on login, so it is newer) and clear
 * `avatar`. Users who already picked an emoji are left untouched; their photo is
 * unrecoverable here and will come back on their next Google login.
 *
 * Safe to re-run — after the first pass no `avatar` matches the URL pattern.
 *
 *   node scripts/migrateAvatarToPhotoUrl.js [--dry-run]
 */

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studylabs';
const URL_AVATAR = /^https?:\/\//;

const run = async () => {
  const dryRun = process.argv.includes('--dry-run');

  await mongoose.connect(MONGO_URI);
  console.log(`Connected to ${mongoose.connection.name}${dryRun ? ' (dry run)' : ''}`);

  const candidates = await User.find({ avatar: URL_AVATAR })
    .select('email avatar photoUrl')
    .lean();

  if (candidates.length === 0) {
    console.log('Nothing to migrate — no user has a URL in `avatar`.');
    return;
  }

  // Only overwrite photoUrl when it is empty; a value there came from a more
  // recent login and is more likely to still resolve.
  const moved = candidates.filter((u) => !u.photoUrl);
  const droppedOnly = candidates.filter((u) => u.photoUrl);

  console.log(`Found ${candidates.length} user(s) with a URL in \`avatar\`:`);
  console.log(`  ${moved.length} → copy to \`photoUrl\` and clear \`avatar\``);
  console.log(`  ${droppedOnly.length} → \`photoUrl\` already set, only clear \`avatar\``);

  if (dryRun) {
    for (const u of candidates) {
      console.log(`  ${u.email}: ${u.photoUrl ? 'clear' : 'move'} ${u.avatar}`);
    }
    console.log('Dry run — no changes written.');
    return;
  }

  const ops = candidates.map((u) => ({
    updateOne: {
      filter: { _id: u._id },
      update: u.photoUrl
        ? { $set: { avatar: null } }
        : { $set: { photoUrl: u.avatar, avatar: null } },
    },
  }));

  const result = await User.bulkWrite(ops, { ordered: false });
  console.log(`Done — ${result.modifiedCount} user(s) updated.`);

  const remaining = await User.countDocuments({ avatar: URL_AVATAR });
  if (remaining > 0) {
    throw new Error(`${remaining} user(s) still have a URL in \`avatar\``);
  }
};

run()
  .catch((error) => {
    console.error(`Migration failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
