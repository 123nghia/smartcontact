// decrypt-mnemonic.js
const fs = require('fs');
const crypto = require('crypto');
const prompt = require('prompt-sync')({ sigint: true });

const filename = process.argv[2] || 'wallet-mnemonic.json';
if (!fs.existsSync(filename)) {
  console.error('File không tồn tại:', filename);
  process.exit(1);
}

const payload = JSON.parse(fs.readFileSync(filename, 'utf8'));
const password = prompt('Nhập mật khẩu để giải mã (không hiển thị): ', { echo: '*' });

const salt = Buffer.from(payload.crypto.kdfparams.salt, 'hex');
const iv = Buffer.from(payload.crypto.iv, 'hex');
const tag = Buffer.from(payload.crypto.tag, 'hex');
const encrypted = payload.crypto.data;
const iterations = payload.crypto.kdfparams.iterations || 200000;

const key = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256');

try {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  console.log('Mnemonic:', decrypted);
} catch (err) {
  console.error('Giải mã thất bại — có thể mật khẩu sai hoặc file bị thay đổi.');
}
