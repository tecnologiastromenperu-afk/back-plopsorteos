import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export const hashPassword = async (plainPassword) => bcrypt.hash(plainPassword, SALT_ROUNDS);

export const comparePassword = async (plainPassword, hash) => bcrypt.compare(plainPassword, hash);
