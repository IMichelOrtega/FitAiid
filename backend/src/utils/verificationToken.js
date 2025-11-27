// backend/src/utils/verificationToken.js
const crypto = require('crypto');

function createVerificationToken(hours = 24) {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
  return { token, tokenHash, expiresAt };
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = { createVerificationToken, hashToken };
