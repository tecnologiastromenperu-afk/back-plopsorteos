import 'dotenv/config';
import mongoose from 'mongoose';
import AdminUser from '../models/AdminUser.js';
import { hashPassword } from '../utils/password.js';

const [, , emailArg, fullNameArg, passwordArg] = process.argv;

if (!emailArg || !fullNameArg || !passwordArg) {
  console.error('Usage: node scripts/createAdminUser.js <email> <fullName> <password>');
  process.exit(1);
}

const email = emailArg.trim().toLowerCase();
const fullName = fullNameArg.trim();
const password = passwordArg;

if (password.length < 6) {
  console.error('Password must be at least 6 characters.');
  process.exit(1);
}

const run = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not configured in .env');
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const passwordHash = await hashPassword(password);

    const result = await AdminUser.findOneAndUpdate(
      { email },
      {
        $set: {
          email,
          fullName,
          passwordHash,
          isActive: true,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log('Admin user ready:');
    console.log(`- id: ${result._id}`);
    console.log(`- email: ${result.email}`);
    console.log(`- fullName: ${result.fullName}`);
    console.log(`- isActive: ${result.isActive}`);
  } catch (error) {
    console.error('Failed to create admin user:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

run();
