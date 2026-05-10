import jwt from 'jsonwebtoken';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
};

export const signAdminAccessToken = (admin) => {
  const payload = {
    sub: admin._id.toString(),
    email: admin.email,
    type: 'admin_access',
  };

  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
};

export const verifyAdminAccessToken = (token) => jwt.verify(token, getJwtSecret());
