
# 🧾 TestToken - BEP-20 Utility Token

### 🧠 Dự án: TestToken (BEP-20 Utility Token)
**Mục tiêu:** Triển khai token tiện ích với đầy đủ tính năng quản lý nâng cao: Cap/Mint/Burn/Pause/Blacklist/AccessControl trên Hardhat Devnet và Testnet.

---

## ⚙️ 1️⃣ YÊU CẦU MÔI TRƯỜNG

| Công cụ | Phiên bản khuyến nghị |
|----------|-----------------------|
| Node.js  | ≥ 18.x |
| Hardhat  | 2.22.x |
| Ethers.js | 6.x |
| OpenZeppelin Contracts | 4.9.6 |
| NPM | ≥ 9.x |

---

## 📁 2️⃣ CẤU TRÚC DỰ ÁN

```
smartfolder3/
├── contracts/
│   ├── TestToken.sol           # Contract chính
│   ├── AdminManager.sol        # Quản lý admin roles
│   ├── BlacklistManager.sol    # Quản lý blacklist
│   ├── ITestToken.sol          # Interface với custom errors/events
│   ├── ITestTokenErrors.sol    # Custom errors
│   └── ITestTokenEvents.sol    # Custom events
├── scripts/
│   └── deploy.js
├── test/
│   ├── TestToken.js
│   └── Lock.js
├── ignition/
│   └── modules/
├── hardhat.config.js
├── package.json
└── README.md
```

---

## 🪙 3️⃣ MÔ TẢ CONTRACT

**Tên Token:** `test`  
**Ký hiệu:** `TEST`  
**Decimals:** 18  
**Tổng cung tối đa (cap):** 1,000,000,000 TEST  

### 🔧 **Tính năng chính:**

#### ✅ **Mint & Burn**
- Mint tokens mới (chỉ MINTER_ROLE)
- Burn tokens (tự burn hoặc burn từ)
- Kiểm tra blacklist khi mint/burn

#### ✅ **Supply Management** 
- Cap supply (giới hạn tổng cung)
- Xem số token còn có thể mint

#### ✅ **Pause/Unpause**
- Tạm dừng toàn bộ giao dịch
- Chỉ PAUSER_ROLE mới có quyền pause/unpause
- Tất cả transfer/approve bị vô hiệu hóa khi pause

#### ✅ **Blacklist System**
- Blacklist/unblacklist địa chỉ
- Blacklist batch (nhiều địa chỉ cùng lúc)
- Chặn tất cả hoạt động của địa chỉ bị blacklist

#### ✅ **Access Control (Role-based)**
- **DEFAULT_ADMIN_ROLE**: Quản lý tất cả roles
- **MINTER_ROLE**: Quyền mint tokens
- **PAUSER_ROLE**: Quyền pause/unpause
- **BLACKLISTER_ROLE**: Quyền quản lý blacklist
- Bảo vệ chống renounce last admin

#### ✅ **Emergency Features**
- Emergency withdraw tokens (không phải native token)
- Chỉ admin mới có quyền

#### ✅ **Utility Functions**
- Xem thông tin token và account
- Xem balance nhiều địa chỉ cùng lúc
- Kiểm tra trạng thái pause và roles

---

---

## 🧩 4️⃣ CÀI ĐẶT & CẤU HÌNH

### 📦 **Cài đặt dependencies:**
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts@4.9.6 dotenv
```

### ⚙️ **Cấu hình Hardhat (`hardhat.config.js`):**
```js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "london",
    },
  },
  networks: {
    hardhat: { chainId: 31337 },
    localhost: { url: "http://127.0.0.1:8545" },
    bsctest: {
      url: process.env.BSC_TESTNET_URL || "https://data-seed-prebsc-1-s1.binance.org:8545/",
      chainId: 97,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    }
  },
};
```

---

## 🧪 5️⃣ COMPILE CONTRACT
```bash
npx hardhat clean
npx hardhat compile
```

---

## 🧠 6️⃣ CHẠY DEVNET
```bash
npx hardhat node
```

---

## 🚀 7️⃣ DEPLOY CONTRACT

### **Deploy lên localhost:**
```bash
npx hardhat run scripts/deploy.js --network localhost
```

### **Deploy lên BSC Testnet:**
```bash
npx hardhat run scripts/deploy.js --network bsctest
```

### **Script deploy.js:**
```js
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🚀 Deploying contracts with:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Deployer balance:", hre.ethers.formatEther(balance), "ETH");

  const TestToken = await hre.ethers.getContractFactory("TestToken");
  const token = await TestToken.deploy(deployer.address);
  await token.waitForDeployment();

  const tokenAddress = await token.getAddress();
  console.log("✅ TestToken deployed at:", tokenAddress);
  
  // In thông tin token
  console.log("📋 Token Info:");
  console.log("  Name:", await token.name());
  console.log("  Symbol:", await token.symbol());
  console.log("  Decimals:", await token.decimals());
  console.log("  Total Supply:", (await token.totalSupply()).toString());
  console.log("  Cap:", (await token.cap()).toString());
}

main().catch((error) => {
  console.error("❌ Deploy failed:", error);
  process.exitCode = 1;
});
```

---

## 🧠 8️⃣ TƯƠNG TÁC QUA CONSOLE
```bash
npx hardhat console --network localhost
```

### **Các lệnh hữu ích:**
```js
// Kết nối contract
const token = await ethers.getContractAt("TestToken", "CONTRACT_ADDRESS");

// Xem thông tin cơ bản
await token.name();                    // "test"
await token.symbol();                  // "TEST"
await token.decimals();                // 18
await token.totalSupply();             // Tổng cung hiện tại
await token.cap();                     // Tổng cung tối đa

// Xem thông tin account
await token.getAccountInfo("ADDRESS"); // balance, blacklist, roles
await token.getTokenInfo();            // Tất cả thông tin token

// Kiểm tra roles
await token.hasRole(await token.DEFAULT_ADMIN_ROLE(), "ADDRESS");
await token.hasRole(await token.MINTER_ROLE(), "ADDRESS");
await token.hasRole(await token.PAUSER_ROLE(), "ADDRESS");
await token.hasRole(await token.BLACKLISTER_ROLE(), "ADDRESS");

// Kiểm tra trạng thái
await token.isPaused();                // false
await token.isBlacklisted("ADDRESS");  // false

// Mint tokens (chỉ admin/minter)
await token.mint("ADDRESS", ethers.parseEther("1000"));

// Blacklist (chỉ blacklister)
await token.setBlacklisted("ADDRESS", true);

// Pause contract (chỉ pauser)
await token.pause();
await token.unpause();
```

---

## 🧩 9️⃣ KIỂM TRA TRONG METAMASK

### **Network: Hardhat Devnet**
```
Network Name: Hardhat Local
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
Currency Symbol: ETH
```

### **Add Custom Token:**
```
Token Contract Address: [CONTRACT_ADDRESS_FROM_DEPLOY]
Token Symbol: TEST
Decimals: 18
```

---

## 🧪 10️⃣ CHẠY TEST
```bash
# Chạy tất cả test
npx hardhat test

# Chạy test cụ thể
npx hardhat test test/TestToken.js

# Chạy test với gas reporting
npx hardhat test --reporter gas
```

---

## 🌐 11️⃣ TRIỂN KHAI LÊN TESTNET

### **BSC Testnet:**
```bash
# Cấu hình .env file
BSC_TESTNET_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
PRIVATE_KEY=your_private_key_here

# Deploy
npx hardhat run scripts/deploy.js --network bsctest

# Verify contract
npx hardhat verify --network bsctest CONTRACT_ADDRESS DEPLOYER_ADDRESS
```

---

## 🔐 12️⃣ BẢO MẬT & AUDIT

### **Tính năng bảo mật:**
- ✅ Custom errors thay vì require (tiết kiệm gas)
- ✅ Reentrancy protection từ OpenZeppelin
- ✅ Input validation đầy đủ
- ✅ Role-based access control
- ✅ Emergency pause mechanism
- ✅ Blacklist protection cho tất cả operations
- ✅ Bảo vệ chống renounce last admin

### **Chuẩn audit:**
- ✅ OpenZeppelin v4.9.6 (audit-ready)
- ✅ Solidity ^0.8.28
- ✅ Gas optimization enabled
- ✅ Comprehensive test coverage

---

## ✅ 13️⃣ TỔNG KẾT

| Thành phần | Trạng thái | Ghi chú |
|-------------|------------|---------|
| **Core Features** | ✅ | Mint/Burn/Cap/Pause/Blacklist |
| **Access Control** | ✅ | 4 roles với bảo vệ admin |
| **Emergency Features** | ✅ | Pause + Emergency withdraw |
| **Utility Functions** | ✅ | Batch operations + info views |
| **Security** | ✅ | Audit-ready với OpenZeppelin |
| **Testing** | ✅ | Comprehensive test suite |
| **Devnet** | ✅ | Local development ready |
| **Testnet** | ✅ | BSC Testnet ready |
| **Mainnet** | ✅ | Production ready |

---

## 📞 13️⃣ SUPPORT & CONTACT

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Documentation**: [Wiki](https://github.com/your-repo/wiki)
- **License**: MIT License © 2025

---

**🎉 TestToken - Ready for Production!**
