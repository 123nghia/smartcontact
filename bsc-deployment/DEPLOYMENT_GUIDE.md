# 🚀 BSC Testnet Deployment Guide - Chi Tiết

## 📋 Tổng Quan

Hướng dẫn chi tiết deploy TestToken Ecosystem lên **Binance Smart Chain (BSC) Testnet** với symbol **TEST**.

## 🎯 Thông Tin BSC Testnet

```
Network Name: BSC Testnet
RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545/
Chain ID: 97
Currency Symbol: BNB
Block Explorer: https://testnet.bscscan.com/
```

## 📝 Bước 1: Chuẩn Bị Environment

### 1.1 Tạo File .env
```bash
# Copy file mẫu
cp .env.example .env
```

### 1.2 Cấu Hình .env
```env
# BSC Testnet Configuration
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
BSC_TESTNET_CHAIN_ID=97

# Wallet Configuration
PRIVATE_KEY=your_private_key_here
DEPLOYER_ADDRESS=your_wallet_address_here

# BSCScan Configuration (để verify contracts)
BSCSCAN_API_KEY=your_bscscan_api_key_here

# Contract Configuration
TOKEN_NAME=Test Token
TOKEN_SYMBOL=TEST
TOKEN_DECIMALS=18
TOTAL_SUPPLY=100000000
```

### 1.3 Lấy BSC Testnet BNB
1. Truy cập [BSC Testnet Faucet](https://testnet.binance.org/faucet-smart)
2. Nhập địa chỉ wallet của bạn
3. Claim BNB testnet (cần để trả gas fees)

## 📝 Bước 2: Cài Đặt Dependencies

### 2.1 Cài Đặt Packages
```bash
# Cài đặt dependencies chính
npm install

# Cài đặt thêm packages cho BSC
npm install @nomiclabs/hardhat-etherscan
npm install hardhat-gas-reporter
```

### 2.2 Cấu Hình hardhat.config.js
```javascript
// Thêm vào hardhat.config.js
require("@nomiclabs/hardhat-etherscan");

module.exports = {
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
  }
};
```

## 📝 Bước 3: Deploy Contracts

### 3.1 Deploy TestToken
```bash
# Deploy TestToken lên BSC Testnet
npx hardhat run scripts/deploy-bsc.js --network bscTestnet
```

### 3.2 Verify Contracts
```bash
# Verify contracts trên BSCScan
npx hardhat run scripts/verify-contracts.js --network bscTestnet
```

### 3.3 Setup Roles
```bash
# Setup roles và permissions
npx hardhat run scripts/setup-roles.js --network bscTestnet
```

## 📝 Bước 4: Test Contracts

### 4.1 Test Basic Functions
```bash
# Test các function cơ bản
npx hardhat run scripts/test-bsc.js --network bscTestnet
```

### 4.2 Test trên BSCScan
1. Truy cập contract address trên BSCScan
2. Test các functions trong "Contract" tab
3. Verify tất cả functions hoạt động

## 📝 Bước 5: Cấu Hình MetaMask

### 5.1 Thêm BSC Testnet
```
Network Name: BSC Testnet
RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545/
Chain ID: 97
Currency Symbol: BNB
Block Explorer: https://testnet.bscscan.com/
```

### 5.2 Import Token
```
Contract Address: [Địa chỉ từ deployment]
Symbol: TEST
Decimals: 18
```

## 📝 Bước 6: Kiểm Tra Kết Quả

### 6.1 Contract Addresses
Sau khi deploy, bạn sẽ nhận được:
```
✅ TestToken: 0x...
✅ TestTokenVesting: 0x...
✅ TestTokenStaking: 0x...
✅ TestTokenGovernance: 0x...
✅ TestTokenBuybackBurn: 0x...
```

### 6.2 Verify trên BSCScan
- Truy cập từng contract address
- Kiểm tra "Contract" tab
- Verify tất cả functions có thể gọi

### 6.3 Test trong MetaMask
- Import token với địa chỉ contract
- Kiểm tra balance
- Test transfer functions

## 🔧 Troubleshooting

### Lỗi Thường Gặp

#### 1. "Insufficient funds"
**Nguyên nhân:** Không đủ BNB để trả gas fees
**Giải pháp:** Claim thêm BNB từ faucet

#### 2. "Contract verification failed"
**Nguyên nhân:** API key không đúng hoặc contract chưa deploy
**Giải pháp:** Kiểm tra API key và đợi contract được confirm

#### 3. "Network connection failed"
**Nguyên nhân:** RPC URL không đúng hoặc network không khả dụng
**Giải pháp:** Thử RPC URL khác hoặc đợi network ổn định

## 📊 Expected Results

### Sau khi deploy thành công:
```
✅ TestToken deployed với symbol TEST
✅ Decimals: 18
✅ Total Supply: 100,000,000 TEST
✅ Tất cả ecosystem contracts deployed
✅ Contracts verified trên BSCScan
✅ MetaMask có thể import và sử dụng
✅ Tất cả functions hoạt động bình thường
```

## 🎯 Next Steps

1. **Test đầy đủ** tất cả functions
2. **Document** contract addresses
3. **Setup monitoring** cho contracts
4. **Prepare** cho mainnet deployment

---

**🎉 Chúc mừng! Bạn đã deploy thành công lên BSC Testnet!**
