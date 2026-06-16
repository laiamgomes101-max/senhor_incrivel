const crypto = require('crypto');
const secret = '538fe19a7a078fb8a37fd05d62499159b0262ad5fc0eb16436fb2d05618c059f';
function b64u(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}
const header = b64u({ alg: 'HS256', typ: 'JWT' });
const payload = b64u({ sub: 'dev', tipo: 'candidato', candidato_id: 1, iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000) + 86400 });
const sig = crypto.createHmac('sha256', secret).update(header + '.' + payload).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
console.log(header + '.' + payload + '.' + sig);
