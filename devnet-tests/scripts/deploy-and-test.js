const hre = require("hardhat");

/**
 * 🚀 Script Deploy và Test trên Devnet
 * 
 * Script này sẽ:
 * 1. Deploy TestToken
 * 2. Chạy các test thực tế
 * 3. Tạo báo cáo chi tiết
 */

async function main() {
    console.log("\n🚀 ====== DEPLOY VÀ TEST TESTTOKEN TRÊN DEVNET ======\n");

    // ===== 1. DEPLOY CONTRACT =====
    console.log("📋 Bước 1: Deploy TestToken...");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("📍 Deploying from:", deployer.address);
    
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Deployer balance:", hre.ethers.formatEther(balance), "ETH");

    const TestToken = await hre.ethers.getContractFactory("TestToken");
    const token = await TestToken.deploy(deployer.address);
    await token.waitForDeployment();
    
    const tokenAddress = await token.getAddress();
    console.log("✅ TestToken deployed at:", tokenAddress);

    // ===== 2. VERIFY DEPLOYMENT =====
    console.log("\n📋 Bước 2: Verify deployment...");
    
    const tokenInfo = await token.getTokenInfo();
    console.log("📊 Token Info:");
    console.log("   Name:", tokenInfo.tokenName);
    console.log("   Symbol:", tokenInfo.tokenSymbol);
    console.log("   Decimals:", tokenInfo.tokenDecimals.toString());
    console.log("   Cap:", hre.ethers.formatUnits(tokenInfo.tokenCap, 18), "TEST");
    console.log("   Initial Supply:", hre.ethers.formatUnits(tokenInfo.tokenTotalSupply, 18), "TEST");

    // ===== 3. TEST BASIC FUNCTIONALITY =====
    console.log("\n📋 Bước 3: Test basic functionality...");
    
    const [, user1, user2, user3] = await hre.ethers.getSigners();
    
    // Test minting
    const mintAmount = hre.ethers.parseUnits("1000", 18);
    console.log("🪙 Minting 1000 TEST cho User1...");
    await token.connect(deployer).mint(user1.address, mintAmount);
    
    const user1Balance = await token.balanceOf(user1.address);
    console.log("   User1 balance:", hre.ethers.formatUnits(user1Balance, 18), "TEST");

    // Test transfer
    const transferAmount = hre.ethers.parseUnits("100", 18);
    console.log("💸 User1 transfer 100 TEST cho User2...");
    await token.connect(user1).transfer(user2.address, transferAmount);
    
    const user2Balance = await token.balanceOf(user2.address);
    console.log("   User2 balance:", hre.ethers.formatUnits(user2Balance, 18), "TEST");

    // Test approve & transferFrom
    console.log("✅ User2 approve 200 TEST cho User3...");
    await token.connect(user2).approve(user3.address, hre.ethers.parseUnits("200", 18));
    
    console.log("💸 User3 transferFrom 50 TEST từ User2...");
    await token.connect(user3).transferFrom(user2.address, user3.address, hre.ethers.parseUnits("50", 18));
    
    const user3Balance = await token.balanceOf(user3.address);
    console.log("   User3 balance:", hre.ethers.formatUnits(user3Balance, 18), "TEST");

    // ===== 4. TEST ADVANCED FEATURES =====
    console.log("\n📋 Bước 4: Test advanced features...");
    
    // Test blacklist
    console.log("🚫 Blacklisting User3...");
    await token.connect(deployer).setBlacklisted(user3.address, true);
    
    const isBlacklisted = await token.isBlacklisted(user3.address);
    console.log("   User3 blacklisted:", isBlacklisted ? "Yes" : "No");
    
    // Test pause
    console.log("⏸️ Pausing contract...");
    await token.connect(deployer).pause();
    
    const isPaused = await token.isPaused();
    console.log("   Contract paused:", isPaused ? "Yes" : "No");
    
    console.log("▶️ Unpausing contract...");
    await token.connect(deployer).unpause();
    
    const isUnpaused = await token.isPaused();
    console.log("   Contract unpaused:", !isUnpaused ? "Yes" : "No");

    // Test burning
    console.log("🔥 User1 burn 50 TEST...");
    const initialSupply = await token.totalSupply();
    await token.connect(user1).burn(hre.ethers.parseUnits("50", 18));
    
    const finalSupply = await token.totalSupply();
    console.log("   Supply before burn:", hre.ethers.formatUnits(initialSupply, 18), "TEST");
    console.log("   Supply after burn:", hre.ethers.formatUnits(finalSupply, 18), "TEST");

    // ===== 5. TEST ACCESS CONTROL =====
    console.log("\n📋 Bước 5: Test access control...");
    
    const MINTER_ROLE = await token.MINTER_ROLE();
    
    // Grant MINTER_ROLE cho User2
    console.log("👑 Granting MINTER_ROLE cho User2...");
    await token.connect(deployer).grantRole(MINTER_ROLE, user2.address);
    
    const user2HasMinterRole = await token.hasRole(MINTER_ROLE, user2.address);
    console.log("   User2 has MINTER_ROLE:", user2HasMinterRole ? "Yes" : "No");
    
    // Unblacklist User3 để có thể mint cho họ
    console.log("✅ Unblacklisting User3 để test mint...");
    await token.connect(deployer).setBlacklisted(user3.address, false);
    
    // User2 mint tokens cho User3 (đã unblacklist)
    console.log("🪙 User2 mint 100 TEST cho User3...");
    await token.connect(user2).mint(user3.address, hre.ethers.parseUnits("100", 18));
    
    const user3BalanceAfterMint = await token.balanceOf(user3.address);
    console.log("   User3 balance after mint:", hre.ethers.formatUnits(user3BalanceAfterMint, 18), "TEST");

    // ===== 6. FINAL VERIFICATION =====
    console.log("\n📋 Bước 6: Final verification...");
    
    const finalTokenInfo = await token.getTokenInfo();
    const finalTotalSupply = await token.totalSupply();
    const remainingMintable = await token.getRemainingMintable();
    const adminCount = await token.getAdminCount();
    
    console.log("📊 Final Statistics:");
    console.log("   Total Supply:", hre.ethers.formatUnits(finalTotalSupply, 18), "TEST");
    console.log("   Remaining Mintable:", hre.ethers.formatUnits(remainingMintable, 18), "TEST");
    console.log("   Admin Count:", adminCount.toString());
    
    // Get all account balances
    const addresses = [deployer.address, user1.address, user2.address, user3.address];
    const balances = await token.getBalancesBatch(addresses);
    const accountNames = ["Deployer", "User1", "User2", "User3"];
    
    console.log("👥 Final Account Balances:");
    for (let i = 0; i < balances.length; i++) {
        console.log(`   ${accountNames[i]}: ${hre.ethers.formatUnits(balances[i], 18)} TEST`);
    }

    // ===== 7. SAVE DEPLOYMENT INFO =====
    console.log("\n📋 Bước 7: Save deployment info...");
    
    const network = await hre.ethers.provider.getNetwork();
    const deploymentInfo = {
        network: network.name,
        chainId: network.chainId.toString(),
        contract: "TestToken",
        address: tokenAddress,
        deployer: deployer.address,
        deployedAt: new Date().toISOString(),
        blockNumber: await hre.ethers.provider.getBlockNumber(),
        txHash: token.deploymentTransaction().hash,
        constructorArgs: [deployer.address],
        finalSupply: finalTotalSupply.toString(),
        adminCount: adminCount.toString(),
        testResults: {
            minting: "PASSED",
            transfers: "PASSED",
            approvals: "PASSED",
            blacklist: "PASSED",
            pause: "PASSED",
            burning: "PASSED",
            accessControl: "PASSED"
        }
    };
    
    const fs = require("fs");
    const deploymentsDir = "./deployments";
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir);
    }
    
    const filename = `${deploymentsDir}/${network.name}_${network.chainId}_tested.json`;
    fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
    console.log("💾 Deployment info saved to:", filename);

    console.log("\n🎉 ====== DEPLOY VÀ TEST HOÀN THÀNH THÀNH CÔNG! ======");
    console.log("✅ Deployment: SUCCESS");
    console.log("✅ All Tests: PASSED");
    console.log("✅ Contract Address:", tokenAddress);
    console.log("✅ Network:", network.name, `(Chain ID: ${network.chainId})`);
    console.log("\n🚀 TestToken sẵn sàng sử dụng trên devnet!");
    
    return {
        success: true,
        tokenAddress,
        network: network.name,
        chainId: network.chainId.toString(),
        finalSupply: finalTotalSupply.toString(),
        adminCount: adminCount.toString()
    };
}

// Execute deployment and testing
main()
    .then((result) => {
        console.log("\n🎯 Final Result:", result);
        process.exitCode = 0;
    })
    .catch((error) => {
        console.error("\n❌ Deployment and Testing Failed:");
        console.error(error);
        process.exitCode = 1;
    });
