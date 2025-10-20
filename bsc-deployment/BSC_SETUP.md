# 🔧 BSC Testnet Setup Guide

## 📋 Tổng Quan

Hướng dẫn cài đặt và cấu hình **Binance Smart Chain (BSC) Testnet** để deploy TestToken Ecosystem.

## 🎯 Thông Tin BSC Testnet

### Network Details
```
Network Name: BSC Testnet
RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545/
Chain ID: 97
Currency Symbol: BNB
Block Explorer: https://testnet.bscscan.com/
Faucet: https://testnet.binance.org/faucet-smart
```

### Alternative RPC URLs
```
Primary: https://data-seed-prebsc-1-s1.binance.org:8545/
Backup 1: https://data-seed-prebsc-2-s1.binance.org:8545/
Backup 2: https://data-seed-prebsc-1-s2.binance.org:8545/
Backup 3: https://data-seed-prebsc-2-s2.binance.org:8545/
```

## 🔧 Bước 1: Cài Đặt Wallet

### 1.1 MetaMask
1. Cài đặt MetaMask extension
2. Tạo wallet mới hoặc import existing wallet
3. Lưu private key và seed phrase

### 1.2 Cấu Hình BSC Testnet trong MetaMask

#### Thêm Network:
1. Mở MetaMask
2. Click vào network dropdown (top)
3. Click "Add Network"
4. Click "Add a network manually"
5. Nhập thông tin:
   ```
   Network Name: BSC Testnet
   RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545/
   Chain ID: 97
   Currency Symbol: BNB
   Block Explorer URL: https://testnet.bscscan.com/
   ```

## 🔧 Bước 2: Lấy BSC Testnet BNB

### 2.1 BSC Testnet Faucet
1. Truy cập [BSC Testnet Faucet](https://testnet.binance.org/faucet-smart)
2. Nhập địa chỉ wallet của bạn
3. Click "Give me BNB"
4. Đợi transaction được confirm

### 2.2 Alternative Faucets
- [BSC Testnet Faucet 2](https://testnet.binance.org/faucet-smart)
- [BSC Testnet Faucet 3](https://testnet.binance.org/faucet-smart)

### 2.3 Kiểm Tra Balance
1. Mở MetaMask
2. Chọn BSC Testnet network
3. Kiểm tra BNB balance
4. Cần ít nhất 0.1 BNB để deploy contracts

## 🔧 Bước 3: Cấu Hình Environment

### 3.1 Tạo File .env
```bash
# Trong thư mục gốc của project
cp .env.example .env
```

### 3.2 Cấu Hình .env
```env
# BSC Testnet Configuration
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
BSC_TESTNET_CHAIN_ID=97

# Wallet Configuration
PRIVATE_KEY=your_private_key_here
DEPLOYER_ADDRESS=your_wallet_address_here

# BSCScan Configuration
BSCSCAN_API_KEY=your_bscscan_api_key_here

# Contract Configuration
TOKEN_NAME=Test Token
TOKEN_SYMBOL=TEST
TOKEN_DECIMALS=18
TOTAL_SUPPLY=100000000
```

### 3.3 Lấy BSCScan API Key
1. Truy cập [BSCScan](https://bscscan.com/)
2. Tạo account
3. Vào "API-KEYs" section
4. Tạo API key mới
5. Copy API key vào .env

## 🔧 Bước 4: Cài Đặt Dependencies

### 4.1 Cài Đặt Packages
```bash
# Cài đặt dependencies chính
npm install

# Cài đặt packages cho BSC
npm install @nomiclabs/hardhat-etherscan
npm install hardhat-gas-reporter
npm install @openzeppelin/contracts
```

### 4.2 Cấu Hình hardhat.config.js
```javascript
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC_URL,
      chainId: 97,
      gasPrice: 10000000000, // 10 gwei
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: {
      bscTestnet: process.env.BSCSCAN_API_KEY
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD"
  }
};
```

## 🔧 Bước 5: Test Kết Nối

### 5.1 Test RPC Connection
```bash
# Test kết nối đến BSC Testnet
npx hardhat console --network bscTestnet
```

### 5.2 Test Wallet Balance
```javascript
// Trong hardhat console
const [deployer] = await ethers.getSigners();
console.log("Deployer address:", deployer.address);
console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "BNB");
```

## 🔧 Bước 6: Verify Setup

### 6.1 Checklist
- [ ] MetaMask cài đặt và cấu hình BSC Testnet
- [ ] Wallet có BSC Testnet BNB (ít nhất 0.1 BNB)
- [ ] File .env được cấu hình đúng
- [ ] Dependencies được cài đặt
- [ ] hardhat.config.js được cấu hình
- [ ] BSCScan API key được setup
- [ ] RPC connection hoạt động

### 6.2 Test Commands
```bash
# Test compile
npx hardhat compile

# Test network connection
npx hardhat console --network bscTestnet

# Test deployment (dry run)
npx hardhat run scripts/deploy-bsc.js --network bscTestnet --dry-run
```

## 🔧 Troubleshooting

### Lỗi Thường Gặp

#### 1. "Network connection failed"
**Nguyên nhân:** RPC URL không đúng
**Giải pháp:** Thử RPC URL khác

#### 2. "Insufficient funds"
**Nguyên nhân:** Không đủ BNB
**Giải pháp:** Claim thêm BNB từ faucet

#### 3. "Invalid private key"
**Nguyên nhân:** Private key không đúng format
**Giải pháp:** Kiểm tra private key có đúng không

#### 4. "API key invalid"
**Nguyên nhân:** BSCScan API key không đúng
**Giải pháp:** Tạo API key mới

## 🎯 Ready for Deployment

Sau khi hoàn thành tất cả bước trên, bạn đã sẵn sàng để deploy TestToken Ecosystem lên BSC Testnet!

### Next Steps:
1. Chạy deployment script
2. Verify contracts
3. Test functions
4. Setup MetaMask

---

**🎉 BSC Testnet đã được cài đặt thành công!**
