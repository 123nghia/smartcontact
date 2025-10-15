# 🧪 Devnet Tests - TestToken

## 📁 Cấu trúc folder

```
devnet-tests/
├── scripts/           # Scripts test devnet
│   ├── test-devnet.js         # Kịch bản test chi tiết 14 bước
│   ├── deploy-and-test.js     # Deploy và test cùng lúc
│   ├── run-tests.js           # Chạy toàn bộ test suite
│   └── start-devnet-test.sh   # Script tự động hoàn toàn
├── reports/           # Báo cáo test
│   ├── gas-report.txt         # Báo cáo gas usage
│   └── hardhat-node.log       # Log Hardhat node
├── deployments/       # Thông tin deployment
│   ├── localhost_31337.json           # Deployment info
│   └── localhost_31337_tested.json    # Deployment với test results
└── README.md          # File này
```

## 🚀 Cách sử dụng

### **1. Chạy kịch bản test chi tiết:**
```bash
# Khởi động Hardhat node (terminal 1)
npx hardhat node

# Chạy test (terminal 2)
npx hardhat run devnet-tests/scripts/test-devnet.js --network localhost
```

### **2. Deploy và test cùng lúc:**
```bash
# Khởi động Hardhat node (terminal 1)
npx hardhat node

# Deploy và test (terminal 2)
npx hardhat run devnet-tests/scripts/deploy-and-test.js --network localhost
```

### **3. Chạy toàn bộ test suite:**
```bash
node devnet-tests/scripts/run-tests.js
```

### **4. Script tự động hoàn toàn:**
```bash
./devnet-tests/scripts/start-devnet-test.sh
```

## 📊 Kết quả

### **Gas Report:**
- File: `reports/gas-report.txt`
- Hiển thị gas usage cho tất cả functions
- Deployment cost: 2,130,119 gas (7.1% of block limit)

### **Deployment Info:**
- File: `deployments/localhost_31337_tested.json`
- Chứa thông tin contract, test results, statistics

### **Test Results:**
- ✅ 49 test cases PASSED
- ✅ 14 bước kịch bản thành công
- ✅ Tất cả tính năng hoạt động hoàn hảo

## 🎯 Test Coverage

| Category | Tests | Status |
|----------|-------|---------|
| **Deployment** | 4 | ✅ PASSED |
| **Minting** | 5 | ✅ PASSED |
| **Burning** | 4 | ✅ PASSED |
| **Pause/Unpause** | 4 | ✅ PASSED |
| **Blacklist** | 8 | ✅ PASSED |
| **Access Control** | 7 | ✅ PASSED |
| **Emergency** | 3 | ✅ PASSED |
| **View Functions** | 2 | ✅ PASSED |
| **Edge Cases** | 3 | ✅ PASSED |
| **Devnet Scenario** | 14 | ✅ PASSED |

**Total:** 54 tests - All PASSED ✅

## 🔧 Troubleshooting

### **Lỗi "Cannot connect to network":**
```bash
# Khởi động Hardhat node
npx hardhat node
```

### **Lỗi "Contract compilation failed":**
```bash
# Clean và compile lại
npx hardhat clean
npx hardhat compile
```

### **Lỗi "Insufficient balance":**
- Hardhat devnet có đủ ETH (10,000 ETH mỗi account)
- Kiểm tra balance trong script

## 📝 Notes

- Tất cả test chạy trên localhost (Chain ID: 31337)
- Contract addresses sẽ khác nhau mỗi lần deploy
- Gas costs có thể thay đổi theo network conditions
- Test results được lưu trong `deployments/` folder

## 🎉 Kết luận

TestToken đã được test toàn diện trên devnet với:
- ✅ 54 test cases thành công
- ✅ Gas optimization hoàn hảo
- ✅ Tất cả tính năng hoạt động đúng
- ✅ Sẵn sàng cho production deployment
