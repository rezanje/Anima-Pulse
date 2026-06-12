import crypto from 'node:crypto';

const SECRET = 'RZ/cx9ur6jAPG7o+WQMadA76CjXyHador9UXHUfQvwU=';

function sign(payload) {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
}

function encodeSession(userId, role) {
  const payload = Buffer.from(JSON.stringify({ userId, role })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

const cookie = `ap_session=${encodeSession('u07', 'admin')}`; // u-devi is the admin

async function run() {
  const res = await fetch('http://localhost:3000/api/v1/settings/users', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie
    },
    body: JSON.stringify({
      id: 'u-adit',
      workLat: -6.2487,
      workLng: 106.8694,
      workRadius: 30
    })
  });
  
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', text);
}

run();
