
# 🧾 README_DEVNET.md
### 🧠 Dự án: TestToken (BEP-20 Utility Token)
**Mục tiêu:** Triển khai, kiểm thử, và chạy token Utility có Cap/Mint/Burn/Pause/Blacklist/AccessControl trên Hardhat Devnet.

---

## ⚙️ 1️⃣ YÊU CẦU MÔI TRƯỜNG

| Công cụ | Phiên bản khuyến nghị |
|----------|-----------------------|
| Node.js  | ≥ 18.x |
| Hardhat  | 2.22.x |
| Ethers.js | 6.x |
| OpenZeppelin Contracts | 4.9.x |
| NPM | ≥ 9.x |

---

## 📁 2️⃣ CẤU TRÚC DỰ ÁN

```
smartcontract/
├── contracts/
│   └── TestToken.sol
├── scripts/
│   └── deploy.js
├── test/
│   └── TestToken.js
├── .env
├── hardhat.config.js
├── package.json
└── README_DEVNET.md
```

---

## 🪙 3️⃣ MÔ TẢ CONTRACT

**Tên Token:** `test`  
**Ký hiệu:** `TEST`  
**Tổng cung tối đa (cap):** 1.000.000.000 TEST  
**Các tính năng chính:**
- ✅ Mint / Burn  
- ✅ Cap Supply  
- ✅ Pause / Unpause  
- ✅ Blacklist  
- ✅ AccessControl (Admin / Minter / Pauser / Blacklister)

---

## 🧩 4️⃣ CÀI ĐẶT & CẤU HÌNH

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts@4.9.6 dotenv
```

Cấu hình Hardhat (`hardhat.config.js`):
```js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "london",
    },
  },
  networks: {
    hardhat: { chainId: 31337 },
    localhost: { url: "http://127.0.0.1:8545" },
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
```bash
npx hardhat run scripts/deploy.js --network localhost
```

**scripts/deploy.js**
```js
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🚀 Deploying contracts with:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Deployer balance:", hre.ethers.formatEther(balance), "ETH");

  const Token = await hre.ethers.getContractFactory("TestToken");
  const token = await Token.deploy(deployer.address);
  await token.waitForDeployment();

  console.log("✅ TestToken deployed at:", await token.getAddress());
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
```js
const token = await ethers.getContractAt("TestToken", "0x5FbDB2315678afecb367f032d93F642f64180aa3");
await token.name();
await token.symbol();
(await token.totalSupply()).toString();
```

---

## 🧩 9️⃣ KIỂM TRA TRONG METAMASK
Network: **Hardhat Devnet**
```
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
Currency Symbol: ETH
```

Add Token:
```
0x5FbDB2315678afecb367f032d93F642f64180aa3
```

---

## 🧪 10️⃣ CHẠY TEST
```bash
npx hardhat test --network localhost
```

---

## 🌐 11️⃣ TRIỂN KHAI LÊN TESTNET
```bash
npx hardhat run scripts/deploy.js --network bsctest
```

---

## ✅ 12️⃣ TỔNG KẾT

| Thành phần | Trạng thái |
|-------------|------------|
| Compile Solidity | ✅ |
| Deploy Devnet | ✅ |
| Test | ✅ |
| MetaMask | ✅ |
| Testnet Ready | ✅ |

---

MIT License © 2025 — Cánh Tay Dev Team
