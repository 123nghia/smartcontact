#!/bin/bash

# 🧪 Script khởi động devnet và chạy test tự động
# 
# Script này sẽ:
# 1. Khởi động Hardhat node
# 2. Chạy test suite
# 3. Tạo báo cáo

echo "🧪 ====== KHỞI ĐỘNG DEVNET VÀ CHẠY TEST ======"

# Kiểm tra Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js không được tìm thấy. Vui lòng cài đặt Node.js >= 18.x"
    exit 1
fi

# Kiểm tra npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm không được tìm thấy. Vui lòng cài đặt npm"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Cài đặt dependencies nếu cần
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Compile contracts
echo "🔨 Compiling contracts..."
npx hardhat clean
npx hardhat compile

if [ $? -ne 0 ]; then
    echo "❌ Compilation failed!"
    exit 1
fi

echo "✅ Compilation successful!"

# Khởi động Hardhat node trong background
echo "🚀 Starting Hardhat node..."
npx hardhat node > hardhat-node.log 2>&1 &
HARDHAT_PID=$!

# Đợi node khởi động
echo "⏳ Waiting for Hardhat node to start..."
sleep 5

# Kiểm tra node có chạy không
if ! kill -0 $HARDHAT_PID 2>/dev/null; then
    echo "❌ Failed to start Hardhat node!"
    exit 1
fi

echo "✅ Hardhat node started (PID: $HARDHAT_PID)"

# Chạy test suite
echo "🧪 Running test suite..."
npx hardhat test --network localhost

TEST_EXIT_CODE=$?

# Chạy devnet test scenario
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "🧪 Running devnet test scenario..."
    npx hardhat run scripts/test-devnet.js --network localhost
    SCENARIO_EXIT_CODE=$?
else
    echo "❌ Test suite failed, skipping scenario test"
    SCENARIO_EXIT_CODE=1
fi

# Dừng Hardhat node
echo "🛑 Stopping Hardhat node..."
kill $HARDHAT_PID
wait $HARDHAT_PID 2>/dev/null

# Xóa log file
rm -f hardhat-node.log

# Báo cáo kết quả
echo ""
echo "📊 ====== KẾT QUẢ TEST ======"

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ Test Suite: PASSED"
else
    echo "❌ Test Suite: FAILED"
fi

if [ $SCENARIO_EXIT_CODE -eq 0 ]; then
    echo "✅ Devnet Scenario: PASSED"
else
    echo "❌ Devnet Scenario: FAILED"
fi

if [ $TEST_EXIT_CODE -eq 0 ] && [ $SCENARIO_EXIT_CODE -eq 0 ]; then
    echo ""
    echo "🎉 ====== TẤT CẢ TEST THÀNH CÔNG! ======"
    echo "🚀 TestToken sẵn sàng cho deployment!"
    exit 0
else
    echo ""
    echo "💥 ====== MỘT SỐ TEST THẤT BẠI ======"
    echo "🔍 Vui lòng kiểm tra lại code và chạy lại"
    exit 1
fi
