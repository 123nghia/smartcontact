
# 🚀 TestToken - BEP-20 Utility Token

### 🧠 Dự án: TestToken (BEP-20 Utility Token)
**Mục tiêu:** Triển khai token tiện ích cho nền tảng giao dịch tài sản số với khả năng update và mint thêm token linh hoạt, hỗ trợ vesting system phức tạp.

**Trạng thái:** ✅ **Production Ready** - Smart contract đã được kiểm tra và sẵn sàng triển khai

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
│   ├── TokenHub.sol            # Contract chính - Token Hub BEP-20
│   ├── TokenHubVesting.sol     # Vesting system cho Token Hub
│   ├── AdminManager.sol        # Quản lý admin roles với bảo vệ
│   └── BlacklistManager.sol    # Quản lý blacklist system
├── scripts/
│   └── deploy-tokenhub.js      # Deploy script cho TokenHub
├── test/
│   └── TokenHub.js             # Test suite cho TokenHub
├── devnet-tests/               # Thư mục test devnet
│   ├── scripts/
│   │   ├── deploy-and-test.js  # Deploy và test tự động
│   │   ├── test-devnet.js      # Test devnet chi tiết
│   │   └── run-tests.js        # Chạy test suite
│   ├── deployments/            # Deployment records
│   └── reports/                # Test reports
├── artifacts/                  # Compiled contracts
├── cache/                      # Hardhat cache
├── deployments/                # Deployment records
├── reports/                    # Gas reports
├── hardhat.config.js           # Hardhat configuration
├── package.json                # Dependencies
├── TEST_GUIDE.md              # Hướng dẫn test
├── TOKENHUB_SUMMARY.md        # Tóm tắt TokenHub
└── README.md                   # Documentation này
```

---

## 🪙 3️⃣ MÔ TẢ CONTRACT

**Tên Token:** `Test Token`  
**Ký hiệu:** `Test`  
**Decimals:** 18  
**Tổng cung tối đa (cap):** 100,000,000 Test  
**Chuẩn:** BEP-20 (tương thích ERC-20)  
**Solidity Version:** ^0.8.28  
**OpenZeppelin:** v4.9.6 (Audit-ready)

### 🔧 **Tính năng chính:**

#### ✅ **Token Management**
- **Mint**: Tạo token mới (chỉ MINTER_ROLE)
- **Burn**: Đốt token (tự burn hoặc burn từ)
- **Transfer**: Chuyển token với pause protection
- **Approve**: Ủy quyền chi tiêu với blacklist check
- **Cap**: Giới hạn tổng cung 1 tỷ token

#### ✅ **Security System**
- **Pause/Unpause**: Tạm dừng toàn bộ giao dịch (chỉ PAUSER_ROLE)
- **Blacklist**: Chặn địa chỉ cụ thể
  - Chặn transfer từ/tới địa chỉ blacklist
  - Chặn mint cho địa chỉ blacklist  
  - Chặn burn từ địa chỉ blacklist
  - Chặn approve cho địa chỉ blacklist
- **Batch Blacklist**: Blacklist nhiều địa chỉ cùng lúc

#### ✅ **Access Control (Role-based)**
- **DEFAULT_ADMIN_ROLE**: Quản lý tất cả roles
- **MINTER_ROLE**: Quyền mint tokens
- **PAUSER_ROLE**: Quyền pause/unpause
- **BLACKLISTER_ROLE**: Quyền quản lý blacklist
- **CAP_MANAGER_ROLE**: Quyền quản lý cap
- **VESTING_MANAGER_ROLE**: Quyền quản lý vesting
- **Bảo vệ**: Không cho phép renounce admin cuối cùng

#### ✅ **Emergency Features**
- **Emergency Withdraw**: Rút token khẩn cấp (chỉ admin)
- **Pause Protection**: Tất cả transfer/approve bị vô hiệu hóa khi pause

#### ✅ **Utility Functions**
- **View Functions**: Xem thông tin token, số dư, trạng thái
- **Batch Operations**: Xem số dư nhiều địa chỉ cùng lúc
- **Account Info**: Xem đầy đủ thông tin tài khoản (balance, roles, blacklist)
- **Mintable Check**: Kiểm tra số token còn có thể mint
- **Cap Management**: Quản lý max supply linh hoạt
- **Purpose Tracking**: Track mục đích mint/burn

#### ✅ **Integration**
- **OpenZeppelin**: ERC20, ERC20Burnable, Pausable, AccessControl
- **Custom Errors**: Thay vì require để tiết kiệm gas
- **Events**: Đầy đủ events cho tracking
- **Vesting System**: TokenHubVesting contract tích hợp

---

---

## 🧩 4️⃣ CÀI ĐẶT & CẤU HÌNH

### 📦 **Cài đặt dependencies:**
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts@4.9.6 dotenv
```

### 🔐 **Cấu hình biến môi trường (`.env` ví dụ):**
```bash
# RPC endpoints
BSC_TESTNET_RPC_URL=https://bsc-testnet-rpc.publicnode.com
BSC_MAINNET_RPC_URL=https://bsc-dataseed1.bnbchain.org
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-key

# Private keys
DEV_PRIVATE_KEY=0xabc...
PROD_PRIVATE_KEY=0xdef...

# (Tùy chọn) ép Hardhat dùng chainId BSC testnet khi dev local
LOCAL_CHAIN_ID=97

# Explorer API keys
ETHERSCAN_API_KEY=your-etherscan-key
BSCSCAN_API_KEY=your-bscscan-key

# Gas reporter
REPORT_GAS=false
GAS_REPORTER_OFFLINE=true
COINMARKETCAP_API_KEY=your-cmc-key
```

### ⚙️ **Cấu hình Hardhat (`hardhat.config.js`):**
```js
require("@nomicfoundation/hardhat-toolbox");
require("hardhat-gas-reporter");
require("dotenv").config();

const {
  DEV_PRIVATE_KEY,
  PROD_PRIVATE_KEY,
  PRIVATE_KEY,
  BSC_TESTNET_RPC_URL,
  BSC_MAINNET_RPC_URL,
  SEPOLIA_RPC_URL,
  ETHERSCAN_API_KEY,
  BSCSCAN_API_KEY,
  REPORT_GAS,
  COINMARKETCAP_API_KEY,
  GAS_REPORTER_OFFLINE,
  LOCAL_CHAIN_ID,
} = process.env;

const parseChainId = (value, fallback) => {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const devAccounts = (DEV_PRIVATE_KEY || PRIVATE_KEY)
  ? [DEV_PRIVATE_KEY || PRIVATE_KEY]
  : [];

const prodAccounts = PROD_PRIVATE_KEY
  ? [PROD_PRIVATE_KEY]
  : devAccounts;

module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "london",
    },
  },
  networks: {
    hardhat: {
      chainId: parseChainId(LOCAL_CHAIN_ID, 31337),
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: parseChainId(LOCAL_CHAIN_ID, 31337),
      accounts: devAccounts,
    },
    sepolia: {
      url: SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/demo",
      accounts: devAccounts,
      chainId: 11155111,
    },
    bscTestnet: {
      url: BSC_TESTNET_RPC_URL || "https://bsc-testnet-rpc.publicnode.com",
      accounts: devAccounts,
      chainId: 97,
    },
    bsc: {
      url: BSC_MAINNET_RPC_URL || "https://bsc-dataseed1.bnbchain.org",
      accounts: prodAccounts,
      chainId: 56,
    },
  },
  gasReporter: {
    enabled: REPORT_GAS === "true",
    currency: "USD",
    token: "BNB",
    coinmarketcap: COINMARKETCAP_API_KEY || "",
    noColors: true,
    outputFile: "gas-report.txt",
    offline: GAS_REPORTER_OFFLINE === "true",
  },
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_API_KEY || "",
      sepolia: ETHERSCAN_API_KEY || "",
      goerli: ETHERSCAN_API_KEY || "",
      bsc: BSCSCAN_API_KEY || "",
      bscTestnet: BSCSCAN_API_KEY || "",
    },
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
npx hardhat run scripts/deploy-tokenhub.js --network localhost
```

### **Deploy lên BSC Testnet:**
```bash
npx hardhat run scripts/deploy-tokenhub.js --network bscTestnet
```

### **Deploy lên BSC Mainnet (Production):**
```bash
npx hardhat run scripts/deploy-tokenhub.js --network bsc
```

### **Script deploy-tokenhub.js:**
```js
const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Token Hub Contracts...");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("📋 Deploying contracts with account:", deployer.address);

  // Deploy TokenHub
  const TokenHub = await hre.ethers.getContractFactory("TokenHub");
  const tokenHub = await TokenHub.deploy(deployer.address);
  await tokenHub.waitForDeployment();

  const tokenHubAddress = await tokenHub.getAddress();
  console.log("✅ TokenHub deployed at:", tokenHubAddress);

  // Deploy Vesting Contract
  const TokenHubVesting = await hre.ethers.getContractFactory("TokenHubVesting");
  const vesting = await TokenHubVesting.deploy(tokenHubAddress, deployer.address);
  await vesting.waitForDeployment();

  const vestingAddress = await vesting.getAddress();
  console.log("✅ TokenHubVesting deployed at:", vestingAddress);

  // Setup vesting contract
  await tokenHub.setVestingContract(vestingAddress, true);
  console.log("✅ Vesting contract linked to TokenHub");
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
const testToken = await ethers.getContractAt("TestToken", "TESTTOKEN_ADDRESS");
const vesting = await ethers.getContractAt("TestTokenVesting", "VESTING_ADDRESS");

// Xem thông tin cơ bản
await testToken.name();                    // "Test Token"
await testToken.symbol();                  // "Test"
await testToken.decimals();                // 18
await testToken.currentSupply();           // Tổng cung hiện tại
await testToken.maxSupply();               // Tổng cung tối đa

// Xem thông tin account
await testToken.getAccountInfo("ADDRESS"); // balance, blacklist, roles
await testToken.getTokenInfo();            // Tất cả thông tin token
await testToken.getCapInfo();              // Thông tin cap management

// Kiểm tra roles
await testToken.hasRole(await testToken.DEFAULT_ADMIN_ROLE(), "ADDRESS");
await testToken.hasRole(await testToken.MINTER_ROLE(), "ADDRESS");
await testToken.hasRole(await testToken.PAUSER_ROLE(), "ADDRESS");
await testToken.hasRole(await testToken.BLACKLISTER_ROLE(), "ADDRESS");
await testToken.hasRole(await testToken.CAP_MANAGER_ROLE(), "ADDRESS");
await testToken.hasRole(await testToken.VESTING_MANAGER_ROLE(), "ADDRESS");

// Kiểm tra trạng thái
await testToken.isPaused();                // false
await testToken.isBlacklisted("ADDRESS");  // false
await testToken.mintingEnabled();          // true
await testToken.capIncreaseEnabled();      // false

// Mint tokens (chỉ admin/minter)
await testToken.mint("ADDRESS", ethers.parseEther("1000"), "Purpose");

// Cap management (chỉ cap manager)
await testToken.toggleCapIncrease();
await testToken.increaseMaxSupply(ethers.parseEther("150000000"));

// Vesting (chỉ vesting manager)
await vesting.createTokenomicVesting("ADDRESS", ethers.parseEther("1000000"), 10, 0, 12, "Team");

// Blacklist (chỉ blacklister)
await testToken.setBlacklisted("ADDRESS", true);

// Pause contract (chỉ pauser)
await testToken.pause();
await testToken.unpause();
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
> 💡 Đặt `LOCAL_CHAIN_ID=97` trong `.env` nếu muốn Hardhat giả lập BSC Testnet (gas vẫn là ETH nhưng chainId phù hợp).

### **Add Custom Token:**
```
Token Contract Address: [TESTTOKEN_ADDRESS_FROM_DEPLOY]
Token Symbol: Test
Decimals: 18
```

---

## 🧪 10️⃣ CHẠY TEST

### **Test cơ bản:**
```bash
# Chạy tất cả test
npx hardhat test

# Chạy test cụ thể
npx hardhat test test/TokenHub.js

# Chạy test với gas reporting
REPORT_GAS=true npx hardhat test
```

### **Test Devnet (Tự động):**
```bash
# Chạy test devnet đầy đủ
cd devnet-tests
./scripts/start-devnet-test.sh

# Hoặc chạy từng bước
npx hardhat node                    # Terminal 1
cd devnet-tests
node scripts/deploy-and-test.js     # Terminal 2
```

### **Test BSC Testnet:**
```bash
# Test trên BSC Testnet (cần tạo script mới)
# node scripts/test-bsc-tokenhub.js
```

---

## 🌐 11️⃣ TRIỂN KHAI LÊN TESTNET

### **BSC Testnet:**
```bash
# Cấu hình .env file
DEV_PRIVATE_KEY=0xabc...                 # ví dev/staging
BSC_TESTNET_RPC_URL=https://bsc-testnet-rpc.publicnode.com

# Deploy
npx hardhat run scripts/deploy-tokenhub.js --network bscTestnet

# Verify contracts
npx hardhat verify --network bscTestnet TOKENHUB_ADDRESS DEPLOYER_ADDRESS
npx hardhat verify --network bscTestnet VESTING_ADDRESS TOKENHUB_ADDRESS DEPLOYER_ADDRESS
```

### **BSC Mainnet (Production):**
```bash
PROD_PRIVATE_KEY=0xprod...
BSC_MAINNET_RPC_URL=https://bsc-dataseed1.bnbchain.org

npx hardhat run scripts/deploy-tokenhub.js --network bsc
npx hardhat verify --network bsc TOKENHUB_ADDRESS DEPLOYER_ADDRESS
npx hardhat verify --network bsc VESTING_ADDRESS TOKENHUB_ADDRESS DEPLOYER_ADDRESS
```

---

## 🔐 12️⃣ BẢO MẬT & AUDIT

### **Tính năng bảo mật:**
- ✅ **Custom Errors**: Thay vì require để tiết kiệm gas
- ✅ **Reentrancy Protection**: Từ OpenZeppelin contracts
- ✅ **Input Validation**: Đầy đủ kiểm tra đầu vào
- ✅ **Role-based Access Control**: 4 roles với phân quyền rõ ràng
- ✅ **Emergency Pause**: Cơ chế tạm dừng khẩn cấp
- ✅ **Blacklist Protection**: Chặn tất cả operations của địa chỉ blacklist
- ✅ **Admin Protection**: Bảo vệ chống renounce admin cuối cùng
- ✅ **Zero Address Check**: Kiểm tra địa chỉ zero
- ✅ **Cap Protection**: Giới hạn tổng cung

### **Chuẩn audit:**
- ✅ **OpenZeppelin v4.9.6**: Audit-ready contracts
- ✅ **Solidity ^0.8.28**: Phiên bản ổn định
- ✅ **Gas Optimization**: Enabled với 200 runs
- ✅ **Comprehensive Tests**: Test coverage đầy đủ
- ✅ **Custom Events**: Tracking đầy đủ
- ✅ **Error Handling**: Custom errors thay vì strings

### **Mức độ bảo mật:**
- 🛡️ **High**: Sử dụng OpenZeppelin audit-ready
- 🛡️ **Multi-layer**: Pause + Blacklist + Access Control
- 🛡️ **Emergency Ready**: Có thể xử lý tình huống khẩn cấp

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
| **Devnet Testing** | ✅ | Automated devnet test suite |
| **BSC Testnet** | ✅ | BSC Testnet ready |
| **BSC Mainnet** | ✅ | Production ready |
| **Gas Optimization** | ✅ | Optimized với custom errors |
| **Documentation** | ✅ | Complete README + Test Guide |

### **🎯 Mục đích sử dụng:**
- **DeFi Projects**: Token tiện ích cho dự án DeFi
- **Utility Token**: Token có yêu cầu bảo mật cao
- **Ecosystem Token**: Token trong hệ sinh thái blockchain
- **Enterprise Use**: Ứng dụng doanh nghiệp cần kiểm soát chặt chẽ

### **🚀 Sẵn sàng triển khai:**
- ✅ **Smart Contract**: Hoàn thiện và audit-ready
- ✅ **Testing**: Test suite đầy đủ
- ✅ **Deployment**: Scripts sẵn sàng
- ✅ **Documentation**: Hướng dẫn chi tiết
- ✅ **Security**: Multi-layer protection

---

## 📞 14️⃣ SUPPORT & CONTACT

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Documentation**: [Wiki](https://github.com/your-repo/wiki)
- **License**: MIT License © 2025

---

## 📚 15️⃣ TÀI LIỆU THAM KHẢO

### **OpenZeppelin Contracts:**
- [ERC20 Documentation](https://docs.openzeppelin.com/contracts/4.x/erc20)
- [Access Control](https://docs.openzeppelin.com/contracts/4.x/access-control)
- [Pausable](https://docs.openzeppelin.com/contracts/4.x/security#pausable)

### **BSC Network:**
- [BSC Testnet](https://testnet.bscscan.com/)
- [BSC Mainnet](https://bscscan.com/)
- [BSC RPC Endpoints](https://docs.bnbchain.org/docs/rpc)

### **Hardhat:**
- [Hardhat Documentation](https://hardhat.org/docs)
- [Hardhat Network](https://hardhat.org/hardhat-network/docs)

---

**🎉 TokenHub - Production Ready Smart Contract!**

*Smart contract BEP-20 utility token với khả năng update và mint thêm token linh hoạt, hỗ trợ vesting system phức tạp, sẵn sàng triển khai trên BSC và các mạng tương thích.*
