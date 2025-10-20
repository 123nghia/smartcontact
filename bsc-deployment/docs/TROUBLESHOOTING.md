# 🔧 Troubleshooting Guide - BSC Testnet Deployment

## 📋 Tổng Quan

Hướng dẫn xử lý các lỗi thường gặp khi deploy TestToken Ecosystem lên BSC Testnet.

## 🚨 Lỗi Deployment

### 1. "Insufficient funds for gas"
**Nguyên nhân:** Không đủ BNB để trả gas fees
**Giải pháp:**
```bash
# Kiểm tra balance
npx hardhat console --network bscTestnet
> const [deployer] = await ethers.getSigners();
> console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "BNB");

# Claim BNB từ faucet
# Truy cập: https://testnet.binance.org/faucet-smart
```

### 2. "Network connection failed"
**Nguyên nhân:** RPC URL không hoạt động
**Giải pháp:**
```javascript
// Thử RPC URL khác trong hardhat.config.js
networks: {
  bscTestnet: {
    url: "https://data-seed-prebsc-2-s1.binance.org:8545/", // Backup RPC
    chainId: 97,
    gasPrice: 10000000000,
    accounts: [process.env.PRIVATE_KEY]
  }
}
```

### 3. "Contract deployment failed"
**Nguyên nhân:** Gas limit quá thấp hoặc contract có lỗi
**Giải pháp:**
```javascript
// Tăng gas limit trong hardhat.config.js
networks: {
  bscTestnet: {
    gas: 8000000,
    gasPrice: 10000000000,
    // ...
  }
}
```

### 4. "Private key invalid"
**Nguyên nhân:** Private key không đúng format
**Giải pháp:**
```bash
# Kiểm tra private key trong .env
# Phải bắt đầu với 0x và có 64 ký tự hex
PRIVATE_KEY=0x1234567890abcdef...
```

## 🚨 Lỗi Verification

### 1. "Contract verification failed"
**Nguyên nhân:** API key không đúng hoặc contract chưa deploy
**Giải pháp:**
```bash
# Kiểm tra API key
echo $BSCSCAN_API_KEY

# Verify manual trên BSCScan
# Truy cập: https://testnet.bscscan.com/verifyContract
```

### 2. "Already Verified"
**Nguyên nhân:** Contract đã được verify
**Giải pháp:** Bỏ qua lỗi này, contract đã verified thành công

### 3. "Constructor arguments mismatch"
**Nguyên nhân:** Arguments không đúng
**Giải pháp:**
```javascript
// Kiểm tra constructor arguments
await hre.run("verify:verify", {
  address: contractAddress,
  constructorArguments: [
    // Đúng thứ tự và giá trị
  ]
});
```

## 🚨 Lỗi Testing

### 1. "Contract not found"
**Nguyên nhân:** Contract address không đúng
**Giải pháp:**
```bash
# Kiểm tra contract addresses
cat bsc-deployment/config/contract-addresses.json

# Verify trên BSCScan
# Truy cập: https://testnet.bscscan.com/address/[ADDRESS]
```

### 2. "Function call failed"
**Nguyên nhân:** Không có quyền hoặc contract bị pause
**Giải pháp:**
```javascript
// Kiểm tra roles
const hasRole = await contract.hasRole(ROLE, address);

// Kiểm tra pause status
const isPaused = await contract.paused();
```

### 3. "Transaction reverted"
**Nguyên nhân:** Logic contract không cho phép
**Giải pháp:**
```javascript
// Kiểm tra conditions
const balance = await contract.balanceOf(address);
const allowance = await contract.allowance(from, to);
const isBlacklisted = await contract.blacklisted(address);
```

## 🚨 Lỗi MetaMask

### 1. "Token not found"
**Nguyên nhân:** Contract address không đúng
**Giải pháp:**
- Kiểm tra contract address từ deployment
- Verify trên BSCScan
- Đảm bảo đang ở đúng network (BSC Testnet)

### 2. "Insufficient funds"
**Nguyên nhân:** Không đủ BNB để trả gas
**Giải pháp:**
- Claim BNB từ faucet
- Kiểm tra balance trong MetaMask

### 3. "Transaction failed"
**Nguyên nhân:** Gas limit quá thấp
**Giải pháp:**
- Tăng gas limit trong MetaMask
- Thử lại transaction

## 🚨 Lỗi Network

### 1. "RPC endpoint error"
**Nguyên nhân:** RPC server không khả dụng
**Giải pháp:**
```javascript
// Thử RPC URL khác
const rpcUrls = [
  "https://data-seed-prebsc-1-s1.binance.org:8545/",
  "https://data-seed-prebsc-2-s1.binance.org:8545/",
  "https://data-seed-prebsc-1-s2.binance.org:8545/",
  "https://data-seed-prebsc-2-s2.binance.org:8545/"
];
```

### 2. "Network timeout"
**Nguyên nhân:** Network chậm hoặc overloaded
**Giải pháp:**
- Đợi và thử lại
- Tăng timeout trong config
- Sử dụng RPC URL khác

## 🔧 Debug Commands

### 1. Kiểm tra Network
```bash
# Test RPC connection
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  https://data-seed-prebsc-1-s1.binance.org:8545/
```

### 2. Kiểm tra Balance
```bash
# Hardhat console
npx hardhat console --network bscTestnet
> const [deployer] = await ethers.getSigners();
> console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "BNB");
```

### 3. Kiểm tra Contract
```bash
# Verify contract trên BSCScan
# Truy cập: https://testnet.bscscan.com/address/[CONTRACT_ADDRESS]
```

## 📞 Hỗ Trợ

### Nếu vẫn gặp vấn đề:
1. Kiểm tra logs chi tiết
2. Verify tất cả configurations
3. Test trên network khác
4. Tạo issue trong repository với:
   - Error message đầy đủ
   - Steps để reproduce
   - Environment details
   - Logs và screenshots

### Useful Links:
- [BSC Testnet Faucet](https://testnet.binance.org/faucet-smart)
- [BSCScan Testnet](https://testnet.bscscan.com/)
- [BSC Testnet RPC](https://docs.binance.org/smart-chain/developer/rpc.html)

---

**🔧 Troubleshooting guide giúp bạn giải quyết các vấn đề thường gặp!**
