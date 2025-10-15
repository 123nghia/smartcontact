# 🧪 Hướng dẫn Test TestToken trên Devnet

## 📋 Tổng quan

Dự án TestToken có 6 kịch bản test khác nhau để đảm bảo tất cả tính năng hoạt động đúng từ devnet tới BSC:

1. **Hardhat Test Suite** - Test cases chính thức
2. **Devnet Test Scenario** - Kịch bản test thực tế
3. **BSC Integration Test** - Kịch bản kiểm thử trực tiếp trên BSC
4. **Deploy & Test** - Deploy và test cùng lúc
5. **Automated Test Runner** - Chạy tất cả test tự động
6. **Shell Script** - Tự động hóa hoàn toàn trên devnet

---

## 🚀 Cách chạy Test

### **1. Hardhat Test Suite (Chính thức)**

```bash
# Compile contracts
npx hardhat clean
npx hardhat compile

# Chạy test suite
npx hardhat test

# Chạy với gas reporting
REPORT_GAS=true npx hardhat test
```

**Kết quả:** Chạy tất cả test cases trong `test/TestToken.js`

### **2. Devnet Test Scenario (Thực tế)**

```bash
# Khởi động Hardhat node (terminal 1)
npx hardhat node

# Chạy kịch bản test (terminal 2)
npx hardhat run devnet-tests/scripts/test-devnet.js --network localhost
```

**Kết quả:** Chạy kịch bản test chi tiết với 14 bước kiểm tra

### **3. BSC Integration Test (BSC Testnet/Mainnet)**

```bash
# Chuẩn bị biến môi trường (ví dụ)
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80        # Admin có đầy đủ role + BNB gas
export BSC_TEST_USER1_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d    # User1 có BNB gas
export BSC_TEST_USER2_KEY=0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6    # User2 có BNB gas

# Chạy kịch bản kiểm thử trên BSC Testnet
npx hardhat run scripts/test-bsc.js --network bscTestnet

# Hoặc chạy trên BSC Mainnet (chỉ khi đã audit)
npx hardhat run scripts/test-bsc.js --network bsc
```

**Kết quả:** Deploy TestToken trực tiếp lên BSC, chạy toàn bộ luồng mint/transfer/allowance/pause/blacklist/burn và lưu báo cáo JSON tại `reports/bsc-test-report-*.json`

### **4. Deploy & Test (Tự động)**

```bash
# Khởi động Hardhat node (terminal 1)
npx hardhat node

# Deploy và test cùng lúc (terminal 2)
npx hardhat run devnet-tests/scripts/deploy-and-test.js --network localhost
```

**Kết quả:** Deploy contract và chạy test tự động

### **5. Automated Test Runner (Tất cả)**

```bash
# Chạy tất cả test tự động
node devnet-tests/scripts/run-tests.js
```

**Kết quả:** Chạy toàn bộ test suite và kịch bản

### **6. Shell Script (Hoàn toàn tự động)**

```bash
# Chạy script tự động (Linux/Mac)
./devnet-tests/scripts/start-devnet-test.sh
```

**Kết quả:** Khởi động devnet, chạy test, tạo báo cáo

---

## 📊 Chi tiết các Test Cases

### **Hardhat Test Suite (test/TestToken.js)**

| Test Category | Số lượng | Mô tả |
|---------------|----------|-------|
| **Deployment** | 4 | Kiểm tra deployment và roles |
| **Minting** | 5 | Test mint tokens, cap, permissions |
| **Burning** | 4 | Test burn tokens và blacklist |
| **Pause/Unpause** | 4 | Test pause mechanism |
| **Blacklist** | 8 | Test blacklist functionality |
| **Access Control** | 7 | Test role management |
| **Emergency** | 3 | Test emergency functions |
| **View Functions** | 2 | Test utility functions |
| **Edge Cases** | 3 | Test edge cases |

**Tổng:** 40 test cases

### **Devnet Test Scenario (scripts/test-devnet.js)**

| Bước | Test | Mô tả |
|------|------|-------|
| 1 | Setup Environment | Khởi tạo accounts và network |
| 2 | Deploy Contract | Deploy TestToken |
| 3 | Verify Deployment | Kiểm tra thông tin token |
| 4 | Test Minting | Mint tokens cho users |
| 5 | Test Transfers | Transfer tokens |
| 6 | Test Approve/TransferFrom | Test allowance mechanism |
| 7 | Test Blacklist | Test blacklist functionality |
| 8 | Test Pause | Test pause/unpause |
| 9 | Test Burning | Test burn tokens |
| 10 | Test Access Control | Test role management |
| 11 | Test Emergency | Test emergency functions |
| 12 | Test Utilities | Test utility functions |
| 13 | Test Edge Cases | Test edge cases |
| 14 | Final Summary | Tổng kết kết quả |

---

## 🎯 Kết quả mong đợi

### **✅ Test thành công khi:**

```
🧪 ====== BẮT ĐẦU KỊCH BẢN TEST DEVNET ======

📋 Bước 1: Thiết lập môi trường...
👥 Accounts:
   Admin: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   User1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
   User2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
   User3: 0x90F79bf6EB2c4f870365E785982E1f101E93b906
   Attacker: 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65
🌐 Network: localhost (Chain ID: 31337)

📋 Bước 2: Deploy TestToken...
✅ TestToken deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3

📋 Bước 3: Kiểm tra deployment...
📊 Token Info:
   Name: test
   Symbol: TEST
   Decimals: 18
   Cap: 1000000000.0 TEST
   Total Supply: 0.0 TEST

👤 Admin Roles:
   DEFAULT_ADMIN_ROLE: ✅
   MINTER_ROLE: ✅
   PAUSER_ROLE: ✅
   BLACKLISTER_ROLE: ✅

... (các bước tiếp theo)

🎉 ====== TẤT CẢ TEST HOÀN THÀNH THÀNH CÔNG! ======
🎯 TestToken hoạt động hoàn hảo trên devnet!
```

### **❌ Test thất bại khi:**

```
❌ Test Scenario Failed:
Error: Transaction reverted
    at TestToken.<anonymous> (scripts/test-devnet.js:123:15)

🔍 Hãy kiểm tra:
   1. Hardhat node có đang chạy không?
   2. Contracts có compile thành công không?
   3. Network configuration có đúng không?
```

---

## 🛠️ Troubleshooting

### **Lỗi thường gặp:**

#### 1. **"Network not found"**
```bash
# Giải pháp: Khởi động Hardhat node
npx hardhat node
```

#### 2. **"Contract compilation failed"**
```bash
# Giải pháp: Clean và compile lại
npx hardhat clean
npx hardhat compile
```

#### 3. **"Insufficient balance"**
```bash
# Giải pháp: Hardhat devnet có đủ ETH
# Kiểm tra balance trong script
```

#### 4. **"Transaction reverted"**
```bash
# Giải pháp: Kiểm tra permissions và roles
# Đảm bảo đúng account có đúng role
```

### **Debug Commands:**

```bash
# Kiểm tra network
npx hardhat console --network localhost
> await ethers.provider.getNetwork()

# Kiểm tra balance
> await ethers.provider.getBalance("ACCOUNT_ADDRESS")

# Kiểm tra contract
> const token = await ethers.getContractAt("TestToken", "CONTRACT_ADDRESS")
> await token.name()
```

---

## 📈 Gas Optimization

### **Chạy với gas reporting:**

```bash
# Set environment variable
export REPORT_GAS=true

# Chạy test với gas report
npx hardhat test --reporter gas
```

**Kết quả:** File `gas-report.txt` với thông tin gas usage

---

## 🔄 Continuous Integration

### **GitHub Actions (tùy chọn):**

```yaml
name: Test TestToken
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npx hardhat test
      - run: npx hardhat run scripts/test-devnet.js --network hardhat
```

---

## 📝 Báo cáo Test

### **Files được tạo:**

1. **`gas-report.txt`** - Báo cáo gas usage
2. **`hardhat-node.log`** - Log của Hardhat node
3. **`deployments/*.json`** - Thông tin deployment

### **Thông tin trong báo cáo:**

- Contract address
- Network information
- Gas usage statistics
- Test results summary
- Account balances
- Role assignments

---

## 🎉 Kết luận

Với 4 kịch bản test khác nhau, TestToken được kiểm tra toàn diện:

- ✅ **40+ test cases** chính thức
- ✅ **14 bước** kịch bản test thực tế
- ✅ **Tự động hóa** hoàn toàn
- ✅ **Báo cáo chi tiết** gas và performance
- ✅ **Troubleshooting** guides

**TestToken sẵn sàng cho production!** 🚀
