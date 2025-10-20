# 🚀 TestToken Ecosystem - Complete Guide

## 📋 Tổng Quan

TestToken Ecosystem là một hệ thống token hoàn chỉnh với symbol **TEST** và decimals **18**, bao gồm:

- **TestToken**: Token chính với đầy đủ tính năng
- **TestTokenVesting**: Quản lý vesting tokens
- **TestTokenStaking**: Hệ thống staking
- **TestTokenGovernance**: Quản trị DAO
- **TestTokenBuybackBurn**: Mua lại và đốt tokens

## 🎯 Thông Tin Token

```
Name: Test Token
Symbol: TEST
Decimals: 18
Total Supply: 100,000,000 TEST
Initial Supply: 10,000,000 TEST
```

## 🔧 Cài Đặt

### 1. Khởi động Hardhat Node
```bash
npx hardhat node
```

### 2. Deploy Ecosystem
```bash
npm run deploy
```

### 3. Test Token Functions
```bash
npm run test
```

### 4. Full Ecosystem Test
```bash
npm run full
```

## 🧪 Các Scripts Có Sẵn

### 📦 Deploy Script (`npm run deploy`)
- Deploy toàn bộ ecosystem contracts
- Thiết lập roles và permissions
- Mint tokens ban đầu
- Test basic functions
- Hiển thị thông tin MetaMask

### 🧪 Test Script (`npm run test`)
- Test toàn bộ chức năng TestToken
- Transfer, approval, transferFrom
- Mint function với role-based access
- Pause/unpause functionality
- Blacklist/unblacklist functionality
- Role-based access control

### 🚀 Full Script (`npm run full`)
- Deploy toàn bộ ecosystem
- Test tất cả contracts
- Test tương tác giữa các contracts
- Comprehensive testing suite
- Final summary và MetaMask info

## 📱 MetaMask Integration

### Network Configuration
```
Network Name: Hardhat Local BNB
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
Currency Symbol: BNB
```

### Account Import
```
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### Token Import
```
Contract Address: [Sẽ hiển thị sau khi deploy]
Symbol: TEST
Decimals: 18
```

## 🎮 Test Scenarios

### Scenario 1: Basic Deployment
1. `npm run deploy`
2. Kiểm tra contract addresses
3. Import token vào MetaMask
4. Verify balances

### Scenario 2: Token Testing
1. `npm run test`
2. Kiểm tra tất cả functions
3. Test transfers và approvals
4. Test pause/unpause
5. Test blacklist functionality

### Scenario 3: Full Ecosystem
1. `npm run full`
2. Deploy toàn bộ ecosystem
3. Test tất cả contracts
4. Test tương tác giữa contracts
5. Comprehensive testing

## 🔍 Troubleshooting

### Problem: Decimals = 0 in MetaMask
**Solution:**
- Đảm bảo contract address đầy đủ (42 ký tự với 0x)
- Verify hardhat node đang chạy
- Kiểm tra network configuration

### Problem: Contract not found
**Solution:**
- Restart hardhat node
- Redeploy contracts
- Verify network connection

### Problem: Transfer fails
**Solution:**
- Kiểm tra token có bị pause không
- Verify sufficient balance
- Kiểm tra approval cho transferFrom

## 📊 Expected Results

### After Deploy (`npm run deploy`)
```
✅ TestToken deployed successfully
✅ Symbol: TEST
✅ Decimals: 18
✅ Total Supply: 100,000,000 TEST
✅ Deployer Balance: 20,000,000 TEST
✅ All ecosystem contracts deployed
```

### After Test (`npm run test`)
```
✅ All basic functions tested
✅ Transfer tests passed
✅ Approval tests passed
✅ Mint tests passed
✅ Pause/unpause tests passed
✅ Blacklist tests passed
✅ Role-based access tests passed
```

### After Full (`npm run full`)
```
✅ All contracts deployed
✅ All functions tested
✅ All interactions tested
✅ Comprehensive testing completed
✅ MetaMask integration ready
```

## 🎯 Quick Start

```bash
# 1. Start hardhat node
npx hardhat node

# 2. Deploy ecosystem (in new terminal)
npm run deploy

# 3. Test token functions
npm run test

# 4. Full ecosystem test
npm run full

# 5. Import to MetaMask with displayed address
```

## 📝 Notes

- **Symbol chính thức**: TEST (không phải THB hay STT)
- **Decimals**: Luôn là 18
- **Network**: Hardhat Local BNB (Chain ID: 31337)
- **Currency**: BNB (không phải ETH)
- **All scripts**: Đã được viết lại hoàn toàn

## 🚀 Features

### TestToken Features
- ✅ ERC20 standard compliance
- ✅ Role-based access control
- ✅ Pause/unpause functionality
- ✅ Blacklist/unblacklist functionality
- ✅ Mint function with purpose parameter
- ✅ Burn function
- ✅ Fee discount system
- ✅ Custom errors for gas efficiency

### Ecosystem Features
- ✅ Vesting contract integration
- ✅ Staking contract integration
- ✅ Governance contract integration
- ✅ Buyback/Burn contract integration
- ✅ Role-based permissions
- ✅ Comprehensive testing suite

---

**🎉 Happy Testing với symbol TEST!**
