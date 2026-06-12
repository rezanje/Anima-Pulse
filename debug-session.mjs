import crypto from 'node:crypto';

const SECRET = 'RZ/cx9ur6jAPG7o+WQMadA76CjXyHador9UXHUfQvwU=';

function sign(payload) {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
}

function encodeSession(userId, role) {
  const payload = Buffer.from(JSON.stringify({ userId, role })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

const token = encodeSession('u07', 'admin');
console.log('Token:', token);

function decodeSession(token) {
  const [payload, sig] = token.split('.');
  if (!payload || !sig) { console.log('missing'); return null; }
  if (sign(payload) !== sig) { console.log('bad sig'); return null; }
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

console.log('Decoded:', decodeSession(token));
