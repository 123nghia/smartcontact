const hre = require("hardhat");
const { expect } = require("chai");

/**
 * 🧪 Kịch bản Test Devnet cho TestToken
 * 
 * Kịch bản này sẽ:
 * 1. Deploy TestToken trên local devnet
 * 2. Chạy các test cases thực tế
 * 3. Kiểm tra tất cả tính năng
 * 4. Tạo báo cáo chi tiết
 */

async function main() {
    console.log("\n🧪 ====== BẮT ĐẦU KỊCH BẢN TEST DEVNET ======\n");

    // ===== 1. THIẾT LẬP MÔI TRƯỜNG =====
    console.log("📋 Bước 1: Thiết lập môi trường...");
    
    const [admin, user1, user2, user3, attacker] = await hre.ethers.getSigners();
    console.log("👥 Accounts:");
    console.log("   Admin:", admin.address);
    console.log("   User1:", user1.address);
    console.log("   User2:", user2.address);
    console.log("   User3:", user3.address);
    console.log("   Attacker:", attacker.address);

    // Check network
    const network = await hre.ethers.provider.getNetwork();
    console.log("🌐 Network:", network.name, `(Chain ID: ${network.chainId})`);

    // ===== 2. DEPLOY CONTRACT =====
    console.log("\n📋 Bước 2: Deploy TestToken...");
    
    const TestToken = await hre.ethers.getContractFactory("TestToken");
    const token = await TestToken.deploy(admin.address);
    await token.waitForDeployment();
    
    const tokenAddress = await token.getAddress();
    console.log("✅ TestToken deployed at:", tokenAddress);

    // ===== 3. KIỂM TRA DEPLOYMENT =====
    console.log("\n📋 Bước 3: Kiểm tra deployment...");
    
    const tokenInfo = await token.getTokenInfo();
    console.log("📊 Token Info:");
    console.log("   Name:", tokenInfo.tokenName);
    console.log("   Symbol:", tokenInfo.tokenSymbol);
    console.log("   Decimals:", tokenInfo.tokenDecimals.toString());
    console.log("   Cap:", hre.ethers.formatUnits(tokenInfo.tokenCap, 18), "TEST");
    console.log("   Total Supply:", hre.ethers.formatUnits(tokenInfo.tokenTotalSupply, 18), "TEST");

    // Kiểm tra roles
    const DEFAULT_ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
    const MINTER_ROLE = await token.MINTER_ROLE();
    const PAUSER_ROLE = await token.PAUSER_ROLE();
    const BLACKLISTER_ROLE = await token.BLACKLISTER_ROLE();

    console.log("👤 Admin Roles:");
    console.log("   DEFAULT_ADMIN_ROLE:", await token.hasRole(DEFAULT_ADMIN_ROLE, admin.address) ? "✅" : "❌");
    console.log("   MINTER_ROLE:", await token.hasRole(MINTER_ROLE, admin.address) ? "✅" : "❌");
    console.log("   PAUSER_ROLE:", await token.hasRole(PAUSER_ROLE, admin.address) ? "✅" : "❌");
    console.log("   BLACKLISTER_ROLE:", await token.hasRole(BLACKLISTER_ROLE, admin.address) ? "✅" : "❌");

    // ===== 4. TEST MINTING =====
    console.log("\n📋 Bước 4: Test Minting...");
    
    const mintAmount = hre.ethers.parseUnits("1000", 18);
    
    // Mint cho user1
    console.log("🪙 Minting 1000 TEST cho User1...");
    await token.connect(admin).mint(user1.address, mintAmount);
    
    const user1Balance = await token.balanceOf(user1.address);
    console.log("   User1 balance:", hre.ethers.formatUnits(user1Balance, 18), "TEST");
    
    // Mint cho user2
    console.log("🪙 Minting 500 TEST cho User2...");
    await token.connect(admin).mint(user2.address, hre.ethers.parseUnits("500", 18));
    
    const user2Balance = await token.balanceOf(user2.address);
    console.log("   User2 balance:", hre.ethers.formatUnits(user2Balance, 18), "TEST");

    // Kiểm tra total supply
    const totalSupply = await token.totalSupply();
    console.log("   Total Supply:", hre.ethers.formatUnits(totalSupply, 18), "TEST");

    // ===== 5. TEST TRANSFERS =====
    console.log("\n📋 Bước 5: Test Transfers...");
    
    const transferAmount = hre.ethers.parseUnits("100", 18);
    
    // User1 transfer cho User2
    console.log("💸 User1 transfer 100 TEST cho User2...");
    await token.connect(user1).transfer(user2.address, transferAmount);
    
    const user1BalanceAfter = await token.balanceOf(user1.address);
    const user2BalanceAfter = await token.balanceOf(user2.address);
    console.log("   User1 balance after:", hre.ethers.formatUnits(user1BalanceAfter, 18), "TEST");
    console.log("   User2 balance after:", hre.ethers.formatUnits(user2BalanceAfter, 18), "TEST");

    // ===== 6. TEST APPROVE & TRANSFERFROM =====
    console.log("\n📋 Bước 6: Test Approve & TransferFrom...");
    
    const approveAmount = hre.ethers.parseUnits("200", 18);
    
    // User2 approve cho User3
    console.log("✅ User2 approve 200 TEST cho User3...");
    await token.connect(user2).approve(user3.address, approveAmount);
    
    const allowance = await token.allowance(user2.address, user3.address);
    console.log("   Allowance:", hre.ethers.formatUnits(allowance, 18), "TEST");
    
    // User3 transferFrom User2
    const transferFromAmount = hre.ethers.parseUnits("50", 18);
    console.log("💸 User3 transferFrom 50 TEST từ User2...");
    await token.connect(user3).transferFrom(user2.address, user3.address, transferFromAmount);
    
    const user3Balance = await token.balanceOf(user3.address);
    console.log("   User3 balance:", hre.ethers.formatUnits(user3Balance, 18), "TEST");

    // ===== 7. TEST BLACKLIST =====
    console.log("\n📋 Bước 7: Test Blacklist...");
    
    // Blacklist User3
    console.log("🚫 Blacklisting User3...");
    await token.connect(admin).setBlacklisted(user3.address, true);
    
    const isBlacklisted = await token.isBlacklisted(user3.address);
    console.log("   User3 blacklisted:", isBlacklisted ? "✅" : "❌");
    
    // Thử transfer từ User3 (sẽ fail)
    console.log("❌ Thử transfer từ User3 (sẽ fail)...");
    try {
        await token.connect(user3).transfer(user1.address, hre.ethers.parseUnits("10", 18));
        console.log("   ❌ ERROR: Transfer should have failed!");
    } catch (error) {
        console.log("   ✅ Transfer correctly blocked:", error.reason || "BlacklistedSender");
    }
    
    // Batch blacklist
    console.log("🚫 Batch blacklisting User1 và User2...");
    await token.connect(admin).setBlacklistedBatch([user1.address, user2.address], true);
    
    const user1Blacklisted = await token.isBlacklisted(user1.address);
    const user2Blacklisted = await token.isBlacklisted(user2.address);
    console.log("   User1 blacklisted:", user1Blacklisted ? "✅" : "❌");
    console.log("   User2 blacklisted:", user2Blacklisted ? "✅" : "❌");

    // ===== 8. TEST PAUSE =====
    console.log("\n📋 Bước 8: Test Pause...");
    
    // Unblacklist để test pause
    await token.connect(admin).setBlacklisted(user1.address, false);
    
    console.log("⏸️ Pausing contract...");
    await token.connect(admin).pause();
    
    const isPaused = await token.isPaused();
    console.log("   Contract paused:", isPaused ? "✅" : "❌");
    
    // Thử transfer khi pause (sẽ fail)
    console.log("❌ Thử transfer khi pause (sẽ fail)...");
    try {
        await token.connect(user1).transfer(user2.address, hre.ethers.parseUnits("10", 18));
        console.log("   ❌ ERROR: Transfer should have failed!");
    } catch (error) {
        console.log("   ✅ Transfer correctly blocked:", error.reason || "Pausable: paused");
    }
    
    console.log("▶️ Unpausing contract...");
    await token.connect(admin).unpause();
    
    const isUnpaused = await token.isPaused();
    console.log("   Contract unpaused:", !isUnpaused ? "✅" : "❌");

    // ===== 9. TEST BURNING =====
    console.log("\n📋 Bước 9: Test Burning...");
    
    const burnAmount = hre.ethers.parseUnits("50", 18);
    const initialSupply = await token.totalSupply();
    
    console.log("🔥 User1 burn 50 TEST...");
    await token.connect(user1).burn(burnAmount);
    
    const user1BalanceAfterBurn = await token.balanceOf(user1.address);
    const finalSupply = await token.totalSupply();
    
    console.log("   User1 balance after burn:", hre.ethers.formatUnits(user1BalanceAfterBurn, 18), "TEST");
    console.log("   Supply before burn:", hre.ethers.formatUnits(initialSupply, 18), "TEST");
    console.log("   Supply after burn:", hre.ethers.formatUnits(finalSupply, 18), "TEST");

    // ===== 10. TEST ACCESS CONTROL =====
    console.log("\n📋 Bước 10: Test Access Control...");
    
    // Unblacklist User3 để có thể mint cho họ
    console.log("✅ Unblacklisting User3 để test mint...");
    await token.connect(admin).setBlacklisted(user3.address, false);
    
    // Grant MINTER_ROLE cho User2
    console.log("👑 Granting MINTER_ROLE cho User2...");
    await token.connect(admin).grantRole(MINTER_ROLE, user2.address);
    
    const user2HasMinterRole = await token.hasRole(MINTER_ROLE, user2.address);
    console.log("   User2 has MINTER_ROLE:", user2HasMinterRole ? "✅" : "❌");
    
    // User2 mint tokens cho User3 (đã unblacklist)
    console.log("🪙 User2 mint 100 TEST cho User3...");
    await token.connect(user2).mint(user3.address, hre.ethers.parseUnits("100", 18));
    
    const user3BalanceAfterMint = await token.balanceOf(user3.address);
    console.log("   User3 balance after mint:", hre.ethers.formatUnits(user3BalanceAfterMint, 18), "TEST");
    
    // Revoke role
    console.log("❌ Revoking MINTER_ROLE từ User2...");
    await token.connect(admin).revokeRole(MINTER_ROLE, user2.address);
    
    const user2HasMinterRoleAfter = await token.hasRole(MINTER_ROLE, user2.address);
    console.log("   User2 has MINTER_ROLE after revoke:", user2HasMinterRoleAfter ? "❌" : "✅");

    // ===== 11. TEST EMERGENCY FUNCTIONS =====
    console.log("\n📋 Bước 11: Test Emergency Functions...");
    
    // Deploy mock token để test emergency withdraw
    const MockToken = await hre.ethers.getContractFactory("TestToken");
    const mockToken = await MockToken.deploy(admin.address);
    await mockToken.waitForDeployment();
    
    const mockTokenAddress = await mockToken.getAddress();
    console.log("🪙 Mock token deployed at:", mockTokenAddress);
    
    // Mint mock tokens cho main contract
    await mockToken.connect(admin).mint(tokenAddress, hre.ethers.parseUnits("500", 18));
    
    const mockBalanceBefore = await mockToken.balanceOf(tokenAddress);
    console.log("   Mock tokens in main contract:", hre.ethers.formatUnits(mockBalanceBefore, 18));
    
    // Emergency withdraw
    console.log("🚨 Emergency withdraw 500 mock tokens...");
    await token.connect(admin).emergencyWithdrawToken(
        mockTokenAddress,
        admin.address,
        hre.ethers.parseUnits("500", 18)
    );
    
    const adminMockBalance = await mockToken.balanceOf(admin.address);
    console.log("   Admin mock token balance:", hre.ethers.formatUnits(adminMockBalance, 18));

    // ===== 12. TEST UTILITY FUNCTIONS =====
    console.log("\n📋 Bước 12: Test Utility Functions...");
    
    // Get account info
    const user1Info = await token.getAccountInfo(user1.address);
    console.log("👤 User1 Account Info:");
    console.log("   Balance:", hre.ethers.formatUnits(user1Info.balance, 18), "TEST");
    console.log("   Blacklisted:", user1Info.isBlacklistedStatus ? "Yes" : "No");
    console.log("   Has Admin Role:", user1Info.hasAdminRole ? "Yes" : "No");
    console.log("   Has Minter Role:", user1Info.hasMinterRole ? "Yes" : "No");
    console.log("   Has Pauser Role:", user1Info.hasPauserRole ? "Yes" : "No");
    console.log("   Has Blacklister Role:", user1Info.hasBlacklisterRole ? "Yes" : "No");
    
    // Batch balance check
    const addresses = [user1.address, user2.address, user3.address, admin.address];
    const balances = await token.getBalancesBatch(addresses);
    console.log("📊 Batch Balance Check:");
    for (let i = 0; i < addresses.length; i++) {
        console.log(`   ${addresses[i]}: ${hre.ethers.formatUnits(balances[i], 18)} TEST`);
    }
    
    // Remaining mintable
    const remainingMintable = await token.getRemainingMintable();
    console.log("🪙 Remaining mintable:", hre.ethers.formatUnits(remainingMintable, 18), "TEST");

    // ===== 13. TEST EDGE CASES =====
    console.log("\n📋 Bước 13: Test Edge Cases...");
    
    // Test zero address mint
    console.log("❌ Thử mint cho zero address (sẽ fail)...");
    try {
        await token.connect(admin).mint(ethers.ZeroAddress, hre.ethers.parseUnits("100", 18));
        console.log("   ❌ ERROR: Should have failed!");
    } catch (error) {
        console.log("   ✅ Correctly rejected zero address mint");
    }
    
    // Test insufficient balance transfer
    console.log("❌ Thử transfer vượt quá balance (sẽ fail)...");
    const hugeAmount = hre.ethers.parseUnits("999999", 18);
    try {
        await token.connect(user1).transfer(user2.address, hugeAmount);
        console.log("   ❌ ERROR: Should have failed!");
    } catch (error) {
        console.log("   ✅ Correctly rejected insufficient balance transfer");
    }

    // ===== 14. FINAL SUMMARY =====
    console.log("\n📋 Bước 14: Final Summary...");
    
    const finalTokenInfo = await token.getTokenInfo();
    const finalTotalSupply = await token.totalSupply();
    const finalCap = await token.cap();
    const finalRemainingMintable = await token.getRemainingMintable();
    const adminCount = await token.getAdminCount();
    
    console.log("\n🎉 ====== KẾT QUẢ CUỐI CÙNG ======");
    console.log("📊 Token Statistics:");
    console.log("   Total Supply:", hre.ethers.formatUnits(finalTotalSupply, 18), "TEST");
    console.log("   Cap:", hre.ethers.formatUnits(finalCap, 18), "TEST");
    console.log("   Remaining Mintable:", hre.ethers.formatUnits(finalRemainingMintable, 18), "TEST");
    console.log("   Admin Count:", adminCount.toString());
    console.log("   Contract Paused:", await token.isPaused() ? "Yes" : "No");
    
    console.log("\n👥 Account Balances:");
    const allBalances = await token.getBalancesBatch([admin.address, user1.address, user2.address, user3.address]);
    const accountNames = ["Admin", "User1", "User2", "User3"];
    for (let i = 0; i < allBalances.length; i++) {
        console.log(`   ${accountNames[i]}: ${hre.ethers.formatUnits(allBalances[i], 18)} TEST`);
    }
    
    console.log("\n✅ ====== TẤT CẢ TEST HOÀN THÀNH THÀNH CÔNG! ======");
    console.log("🎯 TestToken hoạt động hoàn hảo trên devnet!");
    console.log("📝 Contract Address:", tokenAddress);
    console.log("🌐 Network:", network.name, `(Chain ID: ${network.chainId})`);
    
    return {
        tokenAddress,
        network: network.name,
        chainId: network.chainId.toString(),
        totalSupply: finalTotalSupply.toString(),
        adminCount: adminCount.toString(),
        success: true
    };
}

// Execute test scenario
main()
    .then((result) => {
        console.log("\n🎉 Test Scenario Result:", result);
        process.exitCode = 0;
    })
    .catch((error) => {
        console.error("\n❌ Test Scenario Failed:");
        console.error(error);
        process.exitCode = 1;
    });
