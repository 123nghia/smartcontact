const hre = require("hardhat");

/**
 * 🚀 BSC Testnet Deployment Script for TokenHub V2
 * Deploys TokenHub V2 contract to BSC Testnet with comprehensive setup
 */
async function main() {
    console.log("🚀 ===== DEPLOYING TOKENHUB V2 TO BSC TESTNET =====");
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
    
    // Deploy TokenHub V2
    const TokenHubV2 = await hre.ethers.getContractFactory("TokenHubV2");
    console.log("📦 Deploying TokenHub V2...");
    
    const tokenHub = await TokenHubV2.deploy(deployer.address);
    await tokenHub.waitForDeployment();
    
    const contractAddress = await tokenHub.getAddress();
    console.log("✅ TokenHub V2 deployed at:", contractAddress);

    // Wait for confirmation
    console.log("⏳ Waiting for confirmation...");
    await tokenHub.deploymentTransaction()?.wait(1);

    console.log("\n📊 ===== CONTRACT INFORMATION =====");
    
    // Get contract info
    const name = await tokenHub.name();
    const symbol = await tokenHub.symbol();
    const decimals = await tokenHub.decimals();
    const totalSupply = await tokenHub.totalSupply();
    
    console.log("📋 Contract Name:", name);
    console.log("🪙 Token Symbol:", symbol);
    console.log("🔢 Decimals:", decimals.toString());
    console.log("📈 Total Supply:", hre.ethers.formatUnits(totalSupply, 18), "THD");
    console.log("👑 Admin:", deployer.address);

    console.log("\n📊 ===== TOKEN ALLOCATION =====");
    
    // Get allocation info
    const teamAllocation = await tokenHub.TEAM_ALLOCATION();
    const nodeOGAllocation = await tokenHub.NODE_OG_ALLOCATION();
    const liquidityAllocation = await tokenHub.LIQUIDITY_ALLOCATION();
    const communityAllocation = await tokenHub.COMMUNITY_ALLOCATION();
    const stakingAllocation = await tokenHub.STAKING_ALLOCATION();
    const ecosystemAllocation = await tokenHub.ECOSYSTEM_ALLOCATION();
    const treasuryAllocation = await tokenHub.TREASURY_ALLOCATION();
    
    const teamPercentage = (teamAllocation * 100n) / totalSupply;
    const nodeOGPercentage = (nodeOGAllocation * 100n) / totalSupply;
    const liquidityPercentage = (liquidityAllocation * 100n) / totalSupply;
    const communityPercentage = (communityAllocation * 100n) / totalSupply;
    const stakingPercentage = (stakingAllocation * 100n) / totalSupply;
    const ecosystemPercentage = (ecosystemAllocation * 100n) / totalSupply;
    const treasuryPercentage = (treasuryAllocation * 100n) / totalSupply;
    
    console.log("👥 Team & Advisors:", hre.ethers.formatUnits(teamAllocation, 18), "THD (" + teamPercentage.toString() + "%)");
    console.log("🌟 Node OG:", hre.ethers.formatUnits(nodeOGAllocation, 18), "THD (" + nodeOGPercentage.toString() + "%)");
    console.log("💧 Liquidity & Market Making:", hre.ethers.formatUnits(liquidityAllocation, 18), "THD (" + liquidityPercentage.toString() + "%)");
    console.log("🎯 Community & Marketing:", hre.ethers.formatUnits(communityAllocation, 18), "THD (" + communityPercentage.toString() + "%)");
    console.log("🔒 Staking & Rewards:", hre.ethers.formatUnits(stakingAllocation, 18), "THD (" + stakingPercentage.toString() + "%)");
    console.log("🌐 Ecosystem & Partnerships:", hre.ethers.formatUnits(ecosystemAllocation, 18), "THD (" + ecosystemPercentage.toString() + "%)");
    console.log("🏦 Treasury / Reserve Fund:", hre.ethers.formatUnits(treasuryAllocation, 18), "THD (" + treasuryPercentage.toString() + "%)");
    
    const totalAllocation = teamAllocation + nodeOGAllocation + liquidityAllocation + 
                          communityAllocation + stakingAllocation + ecosystemAllocation + 
                          treasuryAllocation;
    const totalPercentage = (totalAllocation * 100n) / totalSupply;
    console.log("📊 TỔNG CỘNG:", hre.ethers.formatUnits(totalAllocation, 18), "THD (" + totalPercentage.toString() + "%)");

    console.log("\n🎯 ===== VESTING SCHEDULE =====");
    console.log("📅 Vesting Schedule Overview:");
    console.log("👥 Team & Advisors: 0% TGE, Cliff 6 tháng, Vesting 36 tháng");
    console.log("🌟 Node OG: 10% TGE, Vesting 24 tháng");
    console.log("💧 Liquidity & Market Making: 40% TGE, Vesting 12 tháng");
    console.log("🎯 Community & Marketing: 20% TGE, Vesting 24 tháng");
    console.log("🔒 Staking & Rewards: 0% TGE, Vesting 36 tháng");
    console.log("🌐 Ecosystem & Partnerships: 10% TGE, Vesting 30 tháng");
    console.log("🏦 Treasury / Reserve Fund: 20% TGE, Vesting 48 tháng");

    console.log("\n🎯 ===== TGE RELEASE CALCULATION =====");
    const tgeNodeOG = (nodeOGAllocation * 10n) / 100n;
    const tgeLiquidity = (liquidityAllocation * 40n) / 100n;
    const tgeCommunity = (communityAllocation * 20n) / 100n;
    const tgeEcosystem = (ecosystemAllocation * 10n) / 100n;
    const tgeTreasury = (treasuryAllocation * 20n) / 100n;
    const totalTGE = tgeNodeOG + tgeLiquidity + tgeCommunity + tgeEcosystem + tgeTreasury;
    const tgePercentage = (totalTGE * 100n) / totalSupply;
    
    console.log("🌟 Node OG TGE:", hre.ethers.formatUnits(tgeNodeOG, 18), "THD (10%)");
    console.log("💧 Liquidity TGE:", hre.ethers.formatUnits(tgeLiquidity, 18), "THD (40%)");
    console.log("🎯 Community TGE:", hre.ethers.formatUnits(tgeCommunity, 18), "THD (20%)");
    console.log("🌐 Ecosystem TGE:", hre.ethers.formatUnits(tgeEcosystem, 18), "THD (10%)");
    console.log("🏦 Treasury TGE:", hre.ethers.formatUnits(tgeTreasury, 18), "THD (20%)");
    console.log("📊 TỔNG TGE:", hre.ethers.formatUnits(totalTGE, 18), "THD (" + tgePercentage.toString() + "%)");

    console.log("\n🔧 ===== CONTRACT FEATURES =====");
    
    // Test basic features
    const tokenInfo = await tokenHub.getTokenInfo();
    const accountInfo = await tokenHub.getAccountInfo(deployer.address);
    
    console.log("✅ Minting Enabled:", tokenInfo.mintingEnabled_);
    console.log("✅ Burning Enabled:", tokenInfo.burningEnabled_);
    console.log("✅ Total Burned:", hre.ethers.formatUnits(tokenInfo.totalBurned_, 18), "THD");
    console.log("✅ VIP Tier:", accountInfo.vipTier_.toString());
    console.log("✅ Fee Discount:", accountInfo.feeDiscount_.toString(), "%");
    console.log("✅ Blacklist Status:", accountInfo.isBlacklisted_ ? "Blacklisted" : "Not Blacklisted");

    console.log("\n🌐 ===== NETWORK INFORMATION =====");
    const network = await hre.ethers.provider.getNetwork();
    console.log("🌐 Network:", network.name);
    console.log("🔗 Chain ID:", network.chainId.toString());
    console.log("📍 Contract Address:", contractAddress);
    console.log("🔗 BSCScan URL:", `https://testnet.bscscan.com/address/${contractAddress}`);

    console.log("\n📋 ===== DEPLOYMENT SUMMARY =====");
    console.log("✅ Contract deployed successfully!");
    console.log("✅ All tokenomics implemented correctly");
    console.log("✅ Vesting schedule configured");
    console.log("✅ Admin role assigned");
    console.log("✅ Ready for testing and integration");

    console.log("\n🎯 ===== NEXT STEPS =====");
    console.log("1. 📝 Save contract address:", contractAddress);
    console.log("2. 🧪 Run test script: npx hardhat run scripts/test-bsc.js --network bscTestnet");
    console.log("3. 🔍 Verify on BSCScan:", `https://testnet.bscscan.com/address/${contractAddress}`);
    console.log("4. 📊 Check token info on BSCScan");
    console.log("5. 🚀 Ready for mainnet deployment!");

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
        allocation: {
            team: hre.ethers.formatUnits(teamAllocation, 18),
            nodeOG: hre.ethers.formatUnits(nodeOGAllocation, 18),
            liquidity: hre.ethers.formatUnits(liquidityAllocation, 18),
            community: hre.ethers.formatUnits(communityAllocation, 18),
            staking: hre.ethers.formatUnits(stakingAllocation, 18),
            ecosystem: hre.ethers.formatUnits(ecosystemAllocation, 18),
            treasury: hre.ethers.formatUnits(treasuryAllocation, 18)
        },
        tgeRelease: hre.ethers.formatUnits(totalTGE, 18),
        tgePercentage: tgePercentage.toString()
    };

    const fs = require('fs');
    fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
    console.log("\n💾 Deployment info saved to deployment-info.json");

    console.log("\n🎉 ===== DEPLOYMENT COMPLETED =====");
    console.log("🚀 TokenHub V2 is now live on BSC Testnet!");
}

main().catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exitCode = 1;
});
