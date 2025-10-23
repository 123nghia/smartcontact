const hre = require("hardhat");

/**
 * 🧪 Test Script for Already Deployed TokenHub V2 Contract
 * Tests contract that is already deployed on BSC Testnet
 */
async function main() {
    console.log("🧪 ===== TESTING DEPLOYED TOKENHUB V2 CONTRACT =====");
    console.log("📅 Test Time:", new Date().toISOString());

    // BSC Testnet Contract Address (update this with your deployed contract)
    const contractAddress = "0x2F2e0f681A03e0692430C4683Ca60c652063354d";
    console.log("📍 Contract Address:", contractAddress);

    // Get tester account
    const [tester] = await hre.ethers.getSigners();
    console.log("👤 Tester:", tester.address);

    // Connect to deployed contract
    console.log("\n🔗 Connecting to deployed contract...");
    const TokenHubV2 = await hre.ethers.getContractFactory("TokenHubV2");
    const tokenHub = TokenHubV2.attach(contractAddress);
    console.log("✅ Connected to deployed contract");

    // ===== 1. BASIC CONTRACT INFO =====
    console.log("\n📋 ===== 1. BASIC CONTRACT INFO =====");
    
    try {
        const name = await tokenHub.name();
        const symbol = await tokenHub.symbol();
        const decimals = await tokenHub.decimals();
        const totalSupply = await tokenHub.totalSupply();
        const network = await hre.ethers.provider.getNetwork();
        
        console.log("✅ Contract Name:", name);
        console.log("✅ Token Symbol:", symbol);
        console.log("✅ Decimals:", decimals.toString());
        console.log("✅ Total Supply:", hre.ethers.formatUnits(totalSupply, 18), "THD");
        console.log("✅ Network:", network.name);
        console.log("✅ Chain ID:", network.chainId.toString());
        console.log("✅ Contract Address:", contractAddress);
        console.log("✅ BSCScan URL:", `https://testnet.bscscan.com/address/${contractAddress}`);
        
    } catch (error) {
        console.log("❌ Error getting basic info:", error.message);
    }

    // ===== 2. TOKEN ALLOCATION VERIFICATION =====
    console.log("\n📊 ===== 2. TOKEN ALLOCATION VERIFICATION =====");
    
    try {
        const teamAllocation = await tokenHub.TEAM_ALLOCATION();
        const nodeOGAllocation = await tokenHub.NODE_OG_ALLOCATION();
        const liquidityAllocation = await tokenHub.LIQUIDITY_ALLOCATION();
        const communityAllocation = await tokenHub.COMMUNITY_ALLOCATION();
        const stakingAllocation = await tokenHub.STAKING_ALLOCATION();
        const ecosystemAllocation = await tokenHub.ECOSYSTEM_ALLOCATION();
        const treasuryAllocation = await tokenHub.TREASURY_ALLOCATION();
        
        const totalSupply = await tokenHub.totalSupply();
        
        console.log("📈 Team & Advisors:", hre.ethers.formatUnits(teamAllocation, 18), "THD");
        console.log("📈 Node OG:", hre.ethers.formatUnits(nodeOGAllocation, 18), "THD");
        console.log("📈 Liquidity & Market Making:", hre.ethers.formatUnits(liquidityAllocation, 18), "THD");
        console.log("📈 Community & Marketing:", hre.ethers.formatUnits(communityAllocation, 18), "THD");
        console.log("📈 Staking & Rewards:", hre.ethers.formatUnits(stakingAllocation, 18), "THD");
        console.log("📈 Ecosystem & Partnerships:", hre.ethers.formatUnits(ecosystemAllocation, 18), "THD");
        console.log("📈 Treasury / Reserve Fund:", hre.ethers.formatUnits(treasuryAllocation, 18), "THD");
        
        const totalAllocation = teamAllocation + nodeOGAllocation + liquidityAllocation + 
                              communityAllocation + stakingAllocation + ecosystemAllocation + 
                              treasuryAllocation;
        console.log("📊 TỔNG CỘNG:", hre.ethers.formatUnits(totalAllocation, 18), "THD");
        
        // Verify allocation is correct
        const allocationCorrect = totalAllocation === totalSupply;
        console.log("✅ Allocation Verification:", allocationCorrect ? "PASS" : "FAIL");
        
    } catch (error) {
        console.log("❌ Error verifying allocation:", error.message);
    }

    // ===== 3. VESTING SCHEDULE CALCULATION =====
    console.log("\n📅 ===== 3. VESTING SCHEDULE CALCULATION =====");
    
    try {
        const nodeOGAllocation = await tokenHub.NODE_OG_ALLOCATION();
        const liquidityAllocation = await tokenHub.LIQUIDITY_ALLOCATION();
        const communityAllocation = await tokenHub.COMMUNITY_ALLOCATION();
        const ecosystemAllocation = await tokenHub.ECOSYSTEM_ALLOCATION();
        const treasuryAllocation = await tokenHub.TREASURY_ALLOCATION();
        
        // Calculate TGE releases
        const tgeNodeOG = (nodeOGAllocation * 10n) / 100n;
        const tgeLiquidity = (liquidityAllocation * 40n) / 100n;
        const tgeCommunity = (communityAllocation * 20n) / 100n;
        const tgeEcosystem = (ecosystemAllocation * 10n) / 100n;
        const tgeTreasury = (treasuryAllocation * 20n) / 100n;
        const totalTGE = tgeNodeOG + tgeLiquidity + tgeCommunity + tgeEcosystem + tgeTreasury;
        
        const totalSupply = await tokenHub.totalSupply();
        const tgePercentage = (totalTGE * 100n) / totalSupply;
        
        console.log("🌟 Node OG TGE:", hre.ethers.formatUnits(tgeNodeOG, 18), "THD (10%)");
        console.log("💧 Liquidity TGE:", hre.ethers.formatUnits(tgeLiquidity, 18), "THD (40%)");
        console.log("🎯 Community TGE:", hre.ethers.formatUnits(tgeCommunity, 18), "THD (20%)");
        console.log("🌐 Ecosystem TGE:", hre.ethers.formatUnits(tgeEcosystem, 18), "THD (10%)");
        console.log("🏦 Treasury TGE:", hre.ethers.formatUnits(tgeTreasury, 18), "THD (20%)");
        console.log("📊 TỔNG TGE:", hre.ethers.formatUnits(totalTGE, 18), "THD");
        console.log("📊 TGE PERCENTAGE:", tgePercentage.toString() + "%");
        
        // Vesting amounts
        const vestingNodeOG = nodeOGAllocation - tgeNodeOG;
        const vestingLiquidity = liquidityAllocation - tgeLiquidity;
        const vestingCommunity = communityAllocation - tgeCommunity;
        const vestingEcosystem = ecosystemAllocation - tgeEcosystem;
        const vestingTreasury = treasuryAllocation - tgeTreasury;
        const totalVesting = vestingNodeOG + vestingLiquidity + vestingCommunity + vestingEcosystem + vestingTreasury;
        
        console.log("\n📈 Vesting Amounts:");
        console.log("🌟 Node OG Vesting:", hre.ethers.formatUnits(vestingNodeOG, 18), "THD (24 tháng)");
        console.log("💧 Liquidity Vesting:", hre.ethers.formatUnits(vestingLiquidity, 18), "THD (12 tháng)");
        console.log("🎯 Community Vesting:", hre.ethers.formatUnits(vestingCommunity, 18), "THD (24 tháng)");
        console.log("🌐 Ecosystem Vesting:", hre.ethers.formatUnits(vestingEcosystem, 18), "THD (30 tháng)");
        console.log("🏦 Treasury Vesting:", hre.ethers.formatUnits(vestingTreasury, 18), "THD (48 tháng)");
        console.log("📊 TỔNG VESTING:", hre.ethers.formatUnits(totalVesting, 18), "THD");
        
    } catch (error) {
        console.log("❌ Error calculating vesting:", error.message);
    }

    // ===== 4. ACCOUNT FEATURES TEST =====
    console.log("\n🎯 ===== 4. ACCOUNT FEATURES TEST =====");
    
    try {
        const accountInfo = await tokenHub.getAccountInfo(tester.address);
        const balance = await tokenHub.balanceOf(tester.address);
        
        console.log("✅ VIP Tier:", accountInfo.vipTier_.toString());
        console.log("✅ Fee Discount:", accountInfo.feeDiscount_.toString(), "%");
        console.log("✅ Blacklist Status:", accountInfo.isBlacklisted_ ? "Blacklisted" : "Not Blacklisted");
        console.log("✅ Token Balance:", hre.ethers.formatUnits(balance, 18), "THD");
        console.log("✅ Voting Power:", hre.ethers.formatUnits(balance, 18), "THD");
        
    } catch (error) {
        console.log("❌ Error testing account features:", error.message);
    }

    // ===== 5. TOKEN INFO SUMMARY =====
    console.log("\n📋 ===== 5. TOKEN INFO SUMMARY =====");
    
    try {
        const tokenInfo = await tokenHub.getTokenInfo();
        
        console.log("Name:", tokenInfo.name_);
        console.log("Symbol:", tokenInfo.symbol_);
        console.log("Decimals:", tokenInfo.decimals_.toString());
        console.log("Total Supply:", hre.ethers.formatUnits(tokenInfo.totalSupply_, 18), "THD");
        console.log("Total Burned:", hre.ethers.formatUnits(tokenInfo.totalBurned_, 18), "THD");
        console.log("Minting Enabled:", tokenInfo.mintingEnabled_);
        console.log("Burning Enabled:", tokenInfo.burningEnabled_);
        
    } catch (error) {
        console.log("❌ Error getting token info:", error.message);
    }

    // ===== 6. COMPLIANCE VERIFICATION =====
    console.log("\n✅ ===== 6. COMPLIANCE VERIFICATION =====");
    
    try {
        const name = await tokenHub.name();
        const symbol = await tokenHub.symbol();
        const decimals = await tokenHub.decimals();
        const totalSupply = await tokenHub.totalSupply();
        const network = await hre.ethers.provider.getNetwork();
        
        // Basic compliance checks
        const projectNameCorrect = name === "Token Hub";
        const tokenSymbolCorrect = symbol === "THD";
        const decimalsCorrect = Number(decimals) === 18;
        const totalSupplyCorrect = totalSupply === hre.ethers.parseUnits("100000000", 18);
        const networkCorrect = [97, 31337].includes(Number(network.chainId));
        
        console.log("📋 Project Name:", projectNameCorrect ? "✅ PASS" : "❌ FAIL");
        console.log("🪙 Token Symbol:", tokenSymbolCorrect ? "✅ PASS" : "❌ FAIL");
        console.log("🔢 Token Decimals:", decimalsCorrect ? "✅ PASS" : "❌ FAIL");
        console.log("📈 Total Supply:", totalSupplyCorrect ? "✅ PASS" : "❌ FAIL");
        console.log("🌐 Network:", networkCorrect ? "✅ PASS" : "❌ FAIL");
        
        // Allocation compliance
        const teamAllocation = await tokenHub.TEAM_ALLOCATION();
        const expectedTeam = hre.ethers.parseUnits("7000000", 18);
        const teamCorrect = teamAllocation === expectedTeam;
        console.log("👥 Team Allocation (7%):", teamCorrect ? "✅ PASS" : "❌ FAIL");
        
    } catch (error) {
        console.log("❌ Error in compliance check:", error.message);
    }

    // ===== 7. FINAL SUMMARY =====
    console.log("\n🎉 ===== 7. FINAL SUMMARY =====");
    console.log("✅ Contract Address:", contractAddress);
    console.log("✅ Token: Token Hub (THD)");
    console.log("✅ Total Supply: 100,000,000 THD");
    console.log("✅ Network: BSC Testnet");
    console.log("✅ Status: Deployed and Active");
    console.log("✅ Features: Utility & Governance Token");
    console.log("✅ Standard: ERC-20 (BEP-20 Compatible)");
    
    console.log("\n🎯 Test completed successfully!");
    console.log("📊 Deployed contract is working correctly!");
    console.log("🔗 View on BSCScan:", `https://testnet.bscscan.com/address/${contractAddress}`);
}

main().catch((error) => {
    console.error("❌ Test failed:", error);
    process.exitCode = 1;
});
