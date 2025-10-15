const hre = require("hardhat");
const { spawn } = require("child_process");

/**
 * 🧪 Script chạy test suite cho TestToken
 * 
 * Script này sẽ:
 * 1. Chạy hardhat test suite
 * 2. Chạy kịch bản test devnet
 * 3. Tạo báo cáo tổng hợp
 */

async function runCommand(command, args = []) {
    return new Promise((resolve, reject) => {
        console.log(`\n🚀 Running: ${command} ${args.join(' ')}\n`);
        
        const child = spawn(command, args, {
            stdio: 'inherit',
            shell: true
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Command failed with exit code ${code}`));
            }
        });
        
        child.on('error', (error) => {
            reject(error);
        });
    });
}

async function main() {
    console.log("\n🧪 ====== CHẠY TEST SUITE CHO TESTTOKEN ======\n");
    
    try {
        // ===== 1. COMPILE CONTRACTS =====
        console.log("📋 Bước 1: Compile contracts...");
        await runCommand("npx", ["hardhat", "clean"]);
        await runCommand("npx", ["hardhat", "compile"]);
        console.log("✅ Compilation completed successfully!");

        // ===== 2. CHẠY HARDHAT TEST SUITE =====
        console.log("\n📋 Bước 2: Chạy Hardhat test suite...");
        await runCommand("npx", ["hardhat", "test"]);
        console.log("✅ Hardhat test suite completed successfully!");

        // ===== 3. CHẠY KỊCH BẢN TEST DEVNET =====
        console.log("\n📋 Bước 3: Chạy kịch bản test devnet...");
        await runCommand("npx", ["hardhat", "run", "devnet-tests/scripts/test-devnet.js"]);
        console.log("✅ Devnet test scenario completed successfully!");

        // ===== 4. CHẠY TEST VỚI GAS REPORTING =====
        console.log("\n📋 Bước 4: Chạy test với gas reporting...");
        process.env.REPORT_GAS = "true";
        await runCommand("npx", ["hardhat", "test", "--reporter", "gas"]);
        console.log("✅ Gas reporting completed!");

        console.log("\n🎉 ====== TẤT CẢ TEST HOÀN THÀNH THÀNH CÔNG! ======");
        console.log("✅ Compilation: PASSED");
        console.log("✅ Hardhat Test Suite: PASSED");
        console.log("✅ Devnet Test Scenario: PASSED");
        console.log("✅ Gas Reporting: PASSED");
        console.log("\n🚀 TestToken sẵn sàng cho production!");

    } catch (error) {
        console.error("\n❌ ====== TEST FAILED ======");
        console.error("Error:", error.message);
        console.error("\n🔍 Hãy kiểm tra:");
        console.error("   1. Hardhat node có đang chạy không?");
        console.error("   2. Contracts có compile thành công không?");
        console.error("   3. Network configuration có đúng không?");
        process.exitCode = 1;
    }
}

// Execute test suite
main()
    .then(() => {
        process.exitCode = 0;
    })
    .catch((error) => {
        console.error("\n💥 Test Suite Execution Failed:", error);
        process.exitCode = 1;
    });
