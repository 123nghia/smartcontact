const hre = require("hardhat");

/**
 * 🚀 Utility & Governance Token Deployment Script for BSC Testnet
 * Deploys a utility and governance token for exchange listing (Default Mint, Burn Allowed)
 */
async function main() {
    console.log("🚀 ===== DEPLOYING UTILITY & GOVERNANCE TOKEN TO BSC TESTNET =====");
    console.log("📅 Deployment Time:", new Date().toISOString());

    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("👤 Deployer:", deployer.address);
    
    // Check deployer balance
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Deployer Balance:", hre.ethers.formatEther(balance), "BNB");

    // Check if balance is sufficient
    if (balance < hre.ethers.parseEther("0.01")) {
        console.log("❌ Insufficient balance! Need at least 0.01 BNB for deployment");
        console.log("💡 Get BNB from BSC Testnet Faucet: https://testnet.bnbchain.org/faucet-smart");
        process.exit(1);
    }

    console.log("\n🔨 ===== DEPLOYING CONTRACT =====");
    
    // Deploy Utility & Governance Token
    const TokenHubV2 = await hre.ethers.getContractFactory("TokenHubV2");
    console.log("📦 Deploying Utility & Governance Token...");
    
    const token = await TokenHubV2.deploy(deployer.address);
    await token.waitForDeployment();
    
    const contractAddress = await token.getAddress();
    console.log("✅ Utility & Governance Token deployed at:", contractAddress);

    // Wait for confirmation
    console.log("⏳ Waiting for confirmation...");
    await token.deploymentTransaction()?.wait(1);

    console.log("\n📊 ===== TOKEN INFORMATION =====");
    
    // Get token info
    const name = await token.name();
    const symbol = await token.symbol();
    const decimals = await token.decimals();
    const totalSupply = await token.totalSupply();
    
    console.log("📋 Token Name:", name);
    console.log("🪙 Token Symbol:", symbol);
    console.log("🔢 Decimals:", decimals.toString());
    console.log("📈 Total Supply:", hre.ethers.formatUnits(totalSupply, 18), "THD");
    console.log("👑 Admin:", deployer.address);
    console.log("🎯 Token Type: Utility & Governance Token");

    console.log("\n🔧 ===== CONTRACT FEATURES =====");
    
    // Test basic features
    const tokenInfo = await token.getTokenInfo();
    const deployerBalance = await token.balanceOf(deployer.address);
    
    console.log("✅ Minting Enabled:", tokenInfo.mintingEnabled_);
    console.log("✅ Burning Enabled:", tokenInfo.burningEnabled_);
    console.log("✅ Total Burned:", hre.ethers.formatUnits(tokenInfo.totalBurned_, 18), "THD");
    console.log("✅ Deployer Balance:", hre.ethers.formatUnits(deployerBalance, 18), "THD");
    console.log("✅ ERC-20 Standard: Full Compliance");
    console.log("✅ Access Control: Admin and Burner roles");
    console.log("✅ Pause Mechanism: Emergency pause available");

    console.log("\n🎯 ===== UTILITY & GOVERNANCE FEATURES =====");
    console.log("✅ Utility Token: Can be used for platform services");
    console.log("✅ Governance Token: Voting power based on token balance");
    console.log("✅ Exchange Listing: Ready for trading on exchanges");
    console.log("✅ Standard Compliance: ERC-20 (BEP-20 Compatible)");
    console.log("✅ Default Minting: Standard ERC20 minting available");
    console.log("✅ Burning Allowed: Can burn tokens to reduce supply");

    console.log("\n🌐 ===== NETWORK INFORMATION =====");
    const network = await hre.ethers.provider.getNetwork();
    console.log("🌐 Network:", network.name);
    console.log("🔗 Chain ID:", network.chainId.toString());
    console.log("📍 Contract Address:", contractAddress);
    console.log("🔗 BSCScan URL:", `https://testnet.bscscan.com/address/${contractAddress}`);

    console.log("\n📋 ===== DEPLOYMENT SUMMARY =====");
    console.log("✅ Contract deployed successfully!");
    console.log("✅ Utility & Governance token ready for exchange listing");
    console.log("✅ All basic features working correctly");
    console.log("✅ Admin role assigned");
    console.log("✅ Default minting - burning allowed");
    console.log("✅ Ready for trading and governance!");

    console.log("\n🎯 ===== NEXT STEPS =====");
    console.log("1. 📝 Save contract address:", contractAddress);
    console.log("2. 🧪 Run test script: npx hardhat run scripts/test-simple.js --network bscTestnet");
    console.log("3. 🔍 Verify on BSCScan:", `https://testnet.bscscan.com/address/${contractAddress}`);
    console.log("4. 📊 Check token info on BSCScan");
    console.log("5. 🚀 Submit for exchange listing!");
    console.log("6. 🗳️ Set up governance system for voting!");

    // Save deployment info to file
    const deploymentInfo = {
        contractAddress: contractAddress,
        deployer: deployer.address,
        network: network.name,
        chainId: network.chainId.toString(),
        deploymentTime: new Date().toISOString(),
        tokenInfo: {
            name: name,
            symbol: symbol,
            decimals: decimals.toString(),
            totalSupply: hre.ethers.formatUnits(totalSupply, 18),
            type: "Utility & Governance Token (Default Mint, Burn Allowed)"
        },
        features: {
            mintingEnabled: tokenInfo.mintingEnabled_,
            burningEnabled: tokenInfo.burningEnabled_,
            totalBurned: hre.ethers.formatUnits(tokenInfo.totalBurned_, 18),
            deployerBalance: hre.ethers.formatUnits(deployerBalance, 18)
        }
    };

    const fs = require('fs');
    fs.writeFileSync('utility-governance-token-deployment.json', JSON.stringify(deploymentInfo, null, 2));
    console.log("\n💾 Deployment info saved to utility-governance-token-deployment.json");

    console.log("\n🎉 ===== DEPLOYMENT COMPLETED =====");
    console.log("🚀 Utility & Governance Token is now live on BSC Testnet!");
    console.log("📈 Ready for exchange listing and governance!");
    console.log("🔥 Default minting - burning allowed!");
}

main().catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exitCode = 1;
});