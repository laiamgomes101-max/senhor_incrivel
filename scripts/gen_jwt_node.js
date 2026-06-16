const fs = require('fs');
const crypto = require('crypto');
function b64url(buf){ return buf.toString('base64').replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_'); }
function readSecret(){
  const path = 'config-local.env';
  if(fs.existsSync(path)){
    const lines = fs.readFileSync(path,'utf8').split(/\r?\n/);
    for(const l of lines){
      const m = l.match(/^(JWT_SECRET_KEY|JWT_SECRET)=(.*)$/);
      if(m) return m[2].trim();
    }
  }
  if(process.env.JWT_SECRET_KEY||process.env.JWT_SECRET) return process.env.JWT_SECRET_KEY||process.env.JWT_SECRET;
  console.error('Secret not found'); process.exit(1);
}
const secret = readSecret();
const header = { alg: 'HS256', typ: 'JWT' };
const now = Math.floor(Date.now()/1000);
const payload = { sub: 'dev', tipo: 'candidato', candidato_id: 1, iat: now, exp: now + 24*3600 };
const header_b = Buffer.from(JSON.stringify(header));
const payload_b = Buffer.from(JSON.stringify(payload));
const signing = b64url(header_b)+'.'+b64url(payload_b);
const sig = crypto.createHmac('sha256', secret).update(signing).digest();
const token = signing + '.' + b64url(sig);
console.log(token);
