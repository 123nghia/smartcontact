// create-bsc-wallet-save.js
const { ethers } = require('ethers');
const fs = require('fs');
const crypto = require('crypto');
const prompt = require('prompt-sync')({ sigint: true });

// Tạo ví ngẫu nhiên
const wallet = ethers.Wallet.createRandom();
const mnemonic = wallet.mnemonic?.phrase || null;

console.log('Address :', wallet.address);

// Nếu không có mnemonic (hiếm), thoát
if (!mnemonic) {
  console.error('Không tìm thấy mnemonic từ ethers.Wallet.createRandom().');
  process.exit(1);
}

// Hỏi user có muốn lưu mnemonic không
const save = prompt('Lưu mnemonic vào file được mã hóa? (y/N): ').trim().toLowerCase();
if (save !== 'y') {
  console.log('Mnemonic (KHÔNG được lưu):', mnemonic);
  console.log('=== Lưu ý: nếu bạn không lưu, hãy ghi nhớ seed phrase (12 từ). ===');
  process.exit(0);
}

// Nhập filename và password
let filename = prompt('Tên file lưu (mặc định wallet-mnemonic.json): ').trim();
if (!filename) filename = 'wallet-mnemonic.json';

const password = prompt('Mật khẩu để mã hóa (không hiển thị): ', { echo: '*' });
if (!password) {
  console.error('Cần mật khẩu để mã hóa. Hủy.');
  process.exit(1);
}

// Derive key từ password + salt (PBKDF2)
const salt = crypto.randomBytes(16); // lưu cùng file
const iv = crypto.randomBytes(12); // cho AES-GCM
const key = crypto.pbkdf2Sync(password, salt, 200000, 32, 'sha256'); // 200k iter

// Mã hóa mnemonic
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
let encrypted = cipher.update(mnemonic, 'utf8', 'hex');
encrypted += cipher.final('hex');
const tag = cipher.getAuthTag();

// Tạo payload JSON
const payload = {
  version: 1,
  address: wallet.address,
  createdAt: new Date().toISOString(),
  crypto: {
    cipher: 'aes-256-gcm',
    kdf: 'pbkdf2',
    kdfparams: {
      salt: salt.toString('hex'),
      iterations: 200000,
      hash: 'sha256',
      keylen: 32
    },
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    data: encrypted
  }
};

// Ghi file với permission 600 (rw-------) nếu hệ thống hỗ trợ
try {
  fs.writeFileSync(filename, JSON.stringify(payload, null, 2), { mode: 0o600 });
  console.log('Đã lưu mnemonic mã hóa vào file:', filename);
  console.log('Hãy giữ mật khẩu an toàn. Nếu quên mật khẩu, không thể lấy lại mnemonic.');
} catch (err) {
  console.error('Lỗi khi ghi file:', err);
}
