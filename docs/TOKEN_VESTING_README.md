# 🔐 TokenVesting Contract - Quick Start Guide

## 📋 Tổng quan nhanh

TokenVesting là smart contract quản lý việc phân phối token TokenHubV2 theo lịch trình vesting với 7 danh mục phân bổ khác nhau.

## 🚀 Quick Start

### 1. Deploy Contract
```bash
npx hardhat run scripts/deploy-vesting.js --network bscTestnet
```

### 2. Khởi tạo Vesting
```javascript
await tokenVesting.startVesting();
```

### 3. Thêm Beneficiaries
```javascript
await tokenVesting.addBeneficiary(userAddress, category, amount);
```

### 4. Claim Tokens
```javascript
await tokenVesting.connect(beneficiary).claim();
```

## 📊 7 Danh mục phân bổ

| Category | % | Tokens | TGE | Cliff | Vesting |
|----------|---|--------|-----|-------|---------|
| Team & Advisors | 7% | 7M | 0% | 180d | 3y |
| Node OG | 3% | 3M | 10% | 0d | 2y |
| Liquidity & Market Making | 15% | 15M | 40% | 0d | 1y |
| Community & Marketing | 20% | 20M | 20% | 0d | 2y |
| Staking & Rewards | 10% | 10M | 0% | 0d | 3y |
| Ecosystem & Partnerships | 25% | 25M | 10% | 0d | 2.5y |
| Treasury / Reserve Fund | 20% | 20M | 20% | 0d | 4y |

## 🔧 Main Functions

- `startVesting()` - Bắt đầu vesting
- `addBeneficiary(user, category, amount)` - Thêm người thụ hưởng
- `batchAdd(users, category, amounts)` - Thêm hàng loạt
- `claimable(user)` - Kiểm tra số token có thể claim
- `claim()` - Claim token
- `deactivate(user)` - Hủy kích hoạt người thụ hưởng
- `getCategoryInfo(category)` - Thống kê danh mục

## 📚 Tài liệu chi tiết

Xem [TOKEN_VESTING_COMPREHENSIVE_GUIDE.md](./TOKEN_VESTING_COMPREHENSIVE_GUIDE.md) để biết thêm chi tiết về:
- Sơ đồ luồng (Flow diagrams)
- Ví dụ thực tế
- Bảng quy đổi
- Troubleshooting

## 🧪 Testing

```bash
npx hardhat test test/vesting-test.js
```

## 📞 Hỗ trợ

Liên hệ team development để được hỗ trợ.
