# 🚀 BSC Testnet Deployment Guide

## 📋 Tổng Quan

Thư mục này chứa tất cả các file và hướng dẫn để deploy TestToken Ecosystem lên **Binance Smart Chain (BSC) Testnet**.

## 🎯 Mục Tiêu

- Deploy TestToken với symbol **TEST** lên BSC Testnet
- Cấu hình đầy đủ ecosystem (Vesting, Staking, Governance, Buyback)
- Hướng dẫn chi tiết từ A-Z
- Scripts tự động hóa deployment

## 📁 Cấu Trúc Thư Mục

```
bsc-deployment/
├── README.md                    # Hướng dẫn chính
├── DEPLOYMENT_GUIDE.md          # Hướng dẫn chi tiết
├── BSC_SETUP.md                 # Cài đặt BSC Testnet
├── scripts/
│   ├── deploy-bsc.js            # Script deploy chính
│   ├── verify-contracts.js      # Script verify contracts
│   ├── setup-roles.js           # Script setup roles
│   └── test-bsc.js              # Script test trên BSC
├── config/
│   ├── bsc-testnet.json         # Cấu hình BSC Testnet
│   ├── contract-addresses.json  # Lưu trữ địa chỉ contracts
│   └── deployment-info.json     # Thông tin deployment
└── docs/
    ├── METAMASK_SETUP.md        # Hướng dẫn MetaMask
    ├── TROUBLESHOOTING.md       # Xử lý lỗi
    └── TESTING_GUIDE.md         # Hướng dẫn test
```

## 🚀 Quick Start

### 1. Chuẩn Bị
```bash
# Copy file cấu hình
cp .env.example .env

# Cài đặt dependencies (nếu chưa có)
npm install
```

### 2. Cấu Hình Environment
```bash
# Chỉnh sửa file .env với thông tin BSC Testnet
nano .env
```

### 3. Deploy
```bash
# Deploy lên BSC Testnet
npm run deploy:bsc

# Verify contracts
npm run verify:bsc

# Test contracts
npm run test:bsc
```

## 🔧 Requirements

- **Node.js**: >= 16.0.0
- **npm**: >= 8.0.0
- **BSC Testnet BNB**: Để trả gas fees
- **Private Key**: Wallet với BSC Testnet BNB

## 📚 Tài Liệu

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Hướng dẫn deploy chi tiết
- [BSC_SETUP.md](./BSC_SETUP.md) - Cài đặt BSC Testnet
- [METAMASK_SETUP.md](./docs/METAMASK_SETUP.md) - Cấu hình MetaMask
- [TESTING_GUIDE.md](./docs/TESTING_GUIDE.md) - Hướng dẫn test

## 🎯 Kết Quả Mong Đợi

Sau khi deploy thành công:
- ✅ TestToken deployed với symbol **TEST**
- ✅ Tất cả ecosystem contracts deployed
- ✅ Roles và permissions được setup
- ✅ Contracts verified trên BSCScan
- ✅ MetaMask có thể import token

## 📞 Hỗ Trợ

Nếu gặp vấn đề, tham khảo:
- [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)
- Tạo issue trong repository

---

**🎉 Happy Deploying on BSC Testnet!**
