import 'dotenv/config';
import { hashPassword } from '../utils/password.js';

const plainPassword = process.argv[2];

if (!plainPassword) {
  console.error('Usage: node scripts/generateAdminHash.js <plainPassword>');
  process.exit(1);
}

const run = async () => {
  const hash = await hashPassword(plainPassword);
  console.log(hash);
};

run().catch((error) => {
  console.error('Failed to generate hash:', error.message);
  process.exit(1);
});
