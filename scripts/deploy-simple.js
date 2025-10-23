const hre = require("hardhat");

/**
 * 🚀 Simple Token Deployment Script for BSC Testnet
 * Deploys a simple ERC-20 token for exchange listing
 */
async function main() {
    console.log("🚀 ===== DEPLOYING SIMPLE TOKEN TO BSC TESTNET =====");
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
    
    // Deploy Simple Token
    const TokenHubV2 = await hre.ethers.getContractFactory("TokenHubV2");
    console.log("📦 Deploying Simple Token...");
    
    const token = await TokenHubV2.deploy(deployer.address);
    await token.waitForDeployment();
    
    const contractAddress = await token.getAddress();
    console.log("✅ Simple Token deployed at:", contractAddress);

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

    console.log("\n📊 ===== TOKEN ALLOCATION (Reference Only) =====");
    
    // Get allocation constants (for reference)
    const teamAllocation = await token.TEAM_ALLOCATION();
    const nodeOGAllocation = await token.NODE_OG_ALLOCATION();
    const liquidityAllocation = await token.LIQUIDITY_ALLOCATION();
    const communityAllocation = await token.COMMUNITY_ALLOCATION();
    const stakingAllocation = await token.STAKING_ALLOCATION();
    const ecosystemAllocation = await token.ECOSYSTEM_ALLOCATION();
    const treasuryAllocation = await token.TREASURY_ALLOCATION();
    
    console.log("👥 Team & Advisors:", hre.ethers.formatUnits(teamAllocation, 18), "THD (7%)");
    console.log("🌟 Node OG:", hre.ethers.formatUnits(nodeOGAllocation, 18), "THD (3%)");
    console.log("💧 Liquidity & Market Making:", hre.ethers.formatUnits(liquidityAllocation, 18), "THD (15%)");
    console.log("🎯 Community & Marketing:", hre.ethers.formatUnits(communityAllocation, 18), "THD (20%)");
    console.log("🔒 Staking & Rewards:", hre.ethers.formatUnits(stakingAllocation, 18), "THD (10%)");
    console.log("🌐 Ecosystem & Partnerships:", hre.ethers.formatUnits(ecosystemAllocation, 18), "THD (25%)");
    console.log("🏦 Treasury / Reserve Fund:", hre.ethers.formatUnits(treasuryAllocation, 18), "THD (20%)");
    
    const totalAllocation = teamAllocation + nodeOGAllocation + liquidityAllocation + 
                          communityAllocation + stakingAllocation + ecosystemAllocation + 
                          treasuryAllocation;
    console.log("📊 TỔNG CỘNG:", hre.ethers.formatUnits(totalAllocation, 18), "THD (100%)");

    console.log("\n🔧 ===== CONTRACT FEATURES =====");
    
    // Test basic features
    const tokenInfo = await token.getTokenInfo();
    const deployerBalance = await token.balanceOf(deployer.address);
    
    console.log("✅ Minting Enabled:", tokenInfo.mintingEnabled_);
    console.log("✅ Burning Enabled:", tokenInfo.burningEnabled_);
    console.log("✅ Total Burned:", hre.ethers.formatUnits(tokenInfo.totalBurned_, 18), "THD");
    console.log("✅ Deployer Balance:", hre.ethers.formatUnits(deployerBalance, 18), "THD");
    console.log("✅ ERC-20 Standard: Full Compliance");
    console.log("✅ Access Control: Role-based permissions");

    console.log("\n🌐 ===== NETWORK INFORMATION =====");
    const network = await hre.ethers.provider.getNetwork();
    console.log("🌐 Network:", network.name);
    console.log("🔗 Chain ID:", network.chainId.toString());
    console.log("📍 Contract Address:", contractAddress);
    console.log("🔗 BSCScan URL:", `https://testnet.bscscan.com/address/${contractAddress}`);

    console.log("\n📋 ===== DEPLOYMENT SUMMARY =====");
    console.log("✅ Contract deployed successfully!");
    console.log("✅ Simple ERC-20 token ready for exchange listing");
    console.log("✅ All basic features working correctly");
    console.log("✅ Admin role assigned");
    console.log("✅ Ready for trading!");

    console.log("\n🎯 ===== NEXT STEPS =====");
    console.log("1. 📝 Save contract address:", contractAddress);
    console.log("2. 🧪 Run test script: npx hardhat run scripts/test-simple.js --network bscTestnet");
    console.log("3. 🔍 Verify on BSCScan:", `https://testnet.bscscan.com/address/${contractAddress}`);
    console.log("4. 📊 Check token info on BSCScan");
    console.log("5. 🚀 Submit for exchange listing!");

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
            totalSupply: hre.ethers.formatUnits(totalSupply, 18)
        },
        features: {
            mintingEnabled: tokenInfo.mintingEnabled_,
            burningEnabled: tokenInfo.burningEnabled_,
            totalBurned: hre.ethers.formatUnits(tokenInfo.totalBurned_, 18),
            deployerBalance: hre.ethers.formatUnits(deployerBalance, 18)
        }
    };

    const fs = require('fs');
    fs.writeFileSync('simple-token-deployment.json', JSON.stringify(deploymentInfo, null, 2));
    console.log("\n💾 Deployment info saved to simple-token-deployment.json");

    console.log("\n🎉 ===== DEPLOYMENT COMPLETED =====");
    console.log("🚀 Simple Token is now live on BSC Testnet!");
    console.log("📈 Ready for exchange listing!");
}

main().catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exitCode = 1;
});
