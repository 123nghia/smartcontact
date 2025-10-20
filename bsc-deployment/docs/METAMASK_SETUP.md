# 📱 MetaMask Setup for BSC Testnet

## 📋 Tổng Quan

Hướng dẫn chi tiết cấu hình MetaMask để sử dụng TestToken trên BSC Testnet.

## 🔧 Bước 1: Cài Đặt MetaMask

### 1.1 Download MetaMask
- **Chrome**: [MetaMask Chrome Extension](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn)
- **Firefox**: [MetaMask Firefox Add-on](https://addons.mozilla.org/en-US/firefox/addon/ether-metamask/)
- **Mobile**: [MetaMask Mobile App](https://metamask.io/download/)

### 1.2 Tạo Wallet
1. Mở MetaMask extension
2. Click "Get Started"
3. Click "Create a New Wallet"
4. Tạo password mạnh
5. Lưu seed phrase (12 words) ở nơi an toàn
6. Confirm seed phrase

## 🔧 Bước 2: Thêm BSC Testnet

### 2.1 Thêm Network Manually
1. Mở MetaMask
2. Click vào network dropdown (top)
3. Click "Add Network"
4. Click "Add a network manually"
5. Nhập thông tin sau:

```
Network Name: BSC Testnet
RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545/
Chain ID: 97
Currency Symbol: BNB
Block Explorer URL: https://testnet.bscscan.com/
```

### 2.2 Alternative RPC URLs
Nếu RPC chính không hoạt động, thử các URL sau:
```
https://data-seed-prebsc-2-s1.binance.org:8545/
https://data-seed-prebsc-1-s2.binance.org:8545/
https://data-seed-prebsc-2-s2.binance.org:8545/
```

## 🔧 Bước 3: Lấy BSC Testnet BNB

### 3.1 BSC Testnet Faucet
1. Truy cập [BSC Testnet Faucet](https://testnet.binance.org/faucet-smart)
2. Nhập địa chỉ wallet của bạn
3. Click "Give me BNB"
4. Đợi transaction được confirm

### 3.2 Kiểm Tra Balance
1. Mở MetaMask
2. Chọn BSC Testnet network
3. Kiểm tra BNB balance
4. Cần ít nhất 0.1 BNB để deploy contracts

## 🔧 Bước 4: Import TestToken

### 4.1 Thêm Custom Token
1. Mở MetaMask
2. Chọn BSC Testnet network
3. Click "Import tokens"
4. Click "Custom Token"
5. Nhập thông tin:

```
Token Contract Address: [Địa chỉ từ deployment]
Token Symbol: TEST
Token Decimals: 18
```

### 4.2 Token Information
```
Name: Test Token
Symbol: TEST
Decimals: 18
Total Supply: 100,000,000 TEST
Network: BSC Testnet (Chain ID: 97)
```

## 🔧 Bước 5: Test Functions

### 5.1 Basic Functions
1. Kiểm tra token balance
2. Test transfer function
3. Test approve function
4. Test transferFrom function

### 5.2 Advanced Functions
1. Test mint function (nếu có quyền)
2. Test pause/unpause (nếu có quyền)
3. Test blacklist function (nếu có quyền)

## 🔧 Bước 6: Troubleshooting

### Lỗi Thường Gặp

#### 1. "Token not found"
**Nguyên nhân:** Contract address không đúng
**Giải pháp:** Kiểm tra contract address từ deployment

#### 2. "Insufficient funds"
**Nguyên nhân:** Không đủ BNB để trả gas fees
**Giải pháp:** Claim thêm BNB từ faucet

#### 3. "Transaction failed"
**Nguyên nhân:** Gas limit quá thấp hoặc network issues
**Giải pháp:** Tăng gas limit hoặc thử lại sau

#### 4. "Network connection failed"
**Nguyên nhân:** RPC URL không hoạt động
**Giải pháp:** Thử RPC URL khác

## 🔧 Bước 7: Security Tips

### 7.1 Wallet Security
- Không bao giờ chia sẻ seed phrase
- Sử dụng password mạnh
- Enable 2FA nếu có thể
- Backup wallet định kỳ

### 7.2 Transaction Security
- Luôn kiểm tra địa chỉ trước khi gửi
- Verify contract address trên BSCScan
- Không click vào link đáng ngờ
- Sử dụng official websites only

## 🎯 Expected Results

### Sau khi setup thành công:
```
✅ MetaMask cài đặt và cấu hình BSC Testnet
✅ Wallet có BSC Testnet BNB
✅ TestToken được import với symbol TEST
✅ Tất cả functions hoạt động bình thường
✅ Có thể transfer, approve, mint tokens
```

## 📞 Hỗ Trợ

### Nếu gặp vấn đề:
1. Kiểm tra network connection
2. Verify contract address
3. Check BNB balance
4. Tham khảo troubleshooting guide
5. Tạo issue trong repository

---

**🎉 MetaMask đã được setup thành công cho BSC Testnet!**
