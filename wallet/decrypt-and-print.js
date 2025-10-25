// decrypt-and-print.js
const fs = require('fs');
const crypto = require('crypto');
const prompt = require('prompt-sync')({ sigint: true });
const { ethers } = require('ethers');

const filename = process.argv[2] || 'wallet-mnemonic.json';
if (!fs.existsSync(filename)) {
  console.error('File không tồn tại:', filename);
  process.exit(1);
}

const payload = JSON.parse(fs.readFileSync(filename, 'utf8'));
const password = prompt('Nhập mật khẩu để giải mã (không hiển thị): ', { echo: '*' });

// Lấy params từ file
const kdfparams = payload.crypto.kdfparams || {};
const iterations = kdfparams.iterations || 200000;
const salt = Buffer.from(kdfparams.salt, 'hex');
const iv = Buffer.from(payload.crypto.iv, 'hex');
const tag = Buffer.from(payload.crypto.tag, 'hex');
const encrypted = payload.crypto.data;

// Derive key bằng PBKDF2 (sha256) - khớp với create script của bạn
const key = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256');

try {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  console.log('\n=== Giải mã thành công ===');
  console.log('Mnemonic:', decrypted);

  // Derive wallet(s) từ mnemonic
  // Thông thường dùng path m/44'/60'/0'/0/0 cho account đầu tiên
const path = "m/44'/60'/0'/0/0";
const hdNode = ethers.HDNodeWallet.fromPhrase(decrypted, path);
console.log('Derived address:', hdNode.address);
console.log('PrivateKey:', hdNode.privateKey);

  console.log('\nLưu ý: đây là private key cho account derivation path', path);
} catch (err) {
  console.error('Giải mã thất bại — có thể mật khẩu sai hoặc file bị thay đổi.');
  // console.error(err);
  process.exit(1);
}
