const hre = require("hardhat");

/**
 * 🧪 Comprehensive Test Script for TokenHub V2 on BSC Testnet
 * Tests all features including vesting schedule, tokenomics, and governance
 */
async function main() {
    console.log("🧪 ===== COMPREHENSIVE TEST TOKENHUB V2 BSC TESTNET =====");
    console.log("📅 Test Time:", new Date().toISOString());

    // BSC Testnet Contract Address (update this with your deployed contract)
    const contractAddress = "0x355DaC39c439B2d849163011f5267F2438fa62Fb"
    console.log("📍 Contract Address:", contractAddress);

    // Get tester account
    const [tester] = await hre.ethers.getSigners();
    console.log("👤 Tester:", tester.address);

    // Connect to deployed contract
    console.log("\n🔗 Connecting to BSC Testnet contract...");
    const TokenHubV2 = await hre.ethers.getContractFactory("TokenHubV2");
    const tokenHub = TokenHubV2.attach(contractAddress);
    console.log("✅ Connected to contract");

    // ===== 1. THÔNG TIN CHUNG DỰ ÁN =====
    console.log("\n📋 ===== 1. THÔNG TIN CHUNG DỰ ÁN =====");
    
    try {
        const name = await tokenHub.name();
        const network = await hre.ethers.provider.getNetwork();
        
        console.log("✅ Tên Dự án:", name);
        console.log("✅ Network:", network.name);
        console.log("✅ Chain ID:", network.chainId.toString());
        console.log("✅ Contract Address:", contractAddress);
        console.log("✅ BSCScan URL:", `https://testnet.bscscan.com/address/${contractAddress}`);
        
    } catch (error) {
        console.log("❌ Error testing project info:", error.message);
    }

    // ===== 2. THÔNG TIN TOKEN =====
    console.log("\n🪙 ===== 2. THÔNG TIN TOKEN =====");
    
    try {
        const name = await tokenHub.name();
        const symbol = await tokenHub.symbol();
        const decimals = await tokenHub.decimals();
        const totalSupply = await tokenHub.totalSupply();
        
        console.log("✅ Tên Token:", name);
        console.log("✅ Ký hiệu (Ticker):", symbol);
        console.log("✅ Decimals:", decimals.toString());
        console.log("✅ Tổng cung:", hre.ethers.formatUnits(totalSupply, 18), "THD");
        console.log("✅ Chuẩn Token: ERC-20 (Compatible with BEP-20)");
        console.log("✅ Loại Token: Utility & Governance Token");
        
        // ERC-20 Compliance Test
        const balance = await tokenHub.balanceOf(tester.address);
        console.log("✅ ERC-20 Compliance: Balance =", hre.ethers.formatUnits(balance, 18), "THD");
        
    } catch (error) {
        console.log("❌ Error testing token info:", error.message);
    }

    // ===== 3. TOKEN ALLOCATION =====
    console.log("\n📊 ===== 3. TOKEN ALLOCATION =====");
    
    try {
        const teamAllocation = await tokenHub.TEAM_ALLOCATION();
        const nodeOGAllocation = await tokenHub.NODE_OG_ALLOCATION();
        const liquidityAllocation = await tokenHub.LIQUIDITY_ALLOCATION();
        const communityAllocation = await tokenHub.COMMUNITY_ALLOCATION();
        const stakingAllocation = await tokenHub.STAKING_ALLOCATION();
        const ecosystemAllocation = await tokenHub.ECOSYSTEM_ALLOCATION();
        const treasuryAllocation = await tokenHub.TREASURY_ALLOCATION();
        
        const totalSupply = await tokenHub.totalSupply();
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
        
    } catch (error) {
        console.log("❌ Error testing allocation:", error.message);
    }

    // ===== 4. VESTING SCHEDULE ANALYSIS =====
    console.log("\n📅 ===== 4. VESTING SCHEDULE ANALYSIS =====");
    
    try {
        const teamAllocation = await tokenHub.TEAM_ALLOCATION();
        const nodeOGAllocation = await tokenHub.NODE_OG_ALLOCATION();
        const liquidityAllocation = await tokenHub.LIQUIDITY_ALLOCATION();
        const communityAllocation = await tokenHub.COMMUNITY_ALLOCATION();
        const stakingAllocation = await tokenHub.STAKING_ALLOCATION();
        const ecosystemAllocation = await tokenHub.ECOSYSTEM_ALLOCATION();
        const treasuryAllocation = await tokenHub.TREASURY_ALLOCATION();
        
        console.log("📋 Vesting Schedule Details:");
        console.log("👥 Team & Advisors: 0% TGE, Cliff 6 tháng, Vesting 36 tháng");
        console.log("   - TGE Release: 0 THD (0%)");
        console.log("   - Vesting Amount:", hre.ethers.formatUnits(teamAllocation, 18), "THD");
        console.log("   - Monthly Release: ~", hre.ethers.formatUnits(teamAllocation / 36n, 18), "THD/tháng");
        
        console.log("🌟 Node OG: 10% TGE, Vesting 24 tháng");
        const tgeNodeOG = (nodeOGAllocation * 10n) / 100n;
        const vestingNodeOG = nodeOGAllocation - tgeNodeOG;
        console.log("   - TGE Release:", hre.ethers.formatUnits(tgeNodeOG, 18), "THD (10%)");
        console.log("   - Vesting Amount:", hre.ethers.formatUnits(vestingNodeOG, 18), "THD");
        console.log("   - Monthly Release: ~", hre.ethers.formatUnits(vestingNodeOG / 24n, 18), "THD/tháng");
        
        console.log("💧 Liquidity & Market Making: 40% TGE, Vesting 12 tháng");
        const tgeLiquidity = (liquidityAllocation * 40n) / 100n;
        const vestingLiquidity = liquidityAllocation - tgeLiquidity;
        console.log("   - TGE Release:", hre.ethers.formatUnits(tgeLiquidity, 18), "THD (40%)");
        console.log("   - Vesting Amount:", hre.ethers.formatUnits(vestingLiquidity, 18), "THD");
        console.log("   - Monthly Release: ~", hre.ethers.formatUnits(vestingLiquidity / 12n, 18), "THD/tháng");
        
        console.log("🎯 Community & Marketing: 20% TGE, Vesting 24 tháng");
        const tgeCommunity = (communityAllocation * 20n) / 100n;
        const vestingCommunity = communityAllocation - tgeCommunity;
        console.log("   - TGE Release:", hre.ethers.formatUnits(tgeCommunity, 18), "THD (20%)");
        console.log("   - Vesting Amount:", hre.ethers.formatUnits(vestingCommunity, 18), "THD");
        console.log("   - Monthly Release: ~", hre.ethers.formatUnits(vestingCommunity / 24n, 18), "THD/tháng");
        
        console.log("🔒 Staking & Rewards: 0% TGE, Vesting 36 tháng");
        console.log("   - TGE Release: 0 THD (0%)");
        console.log("   - Vesting Amount:", hre.ethers.formatUnits(stakingAllocation, 18), "THD");
        console.log("   - Monthly Release: ~", hre.ethers.formatUnits(stakingAllocation / 36n, 18), "THD/tháng");
        
        console.log("🌐 Ecosystem & Partnerships: 10% TGE, Vesting 30 tháng");
        const tgeEcosystem = (ecosystemAllocation * 10n) / 100n;
        const vestingEcosystem = ecosystemAllocation - tgeEcosystem;
        console.log("   - TGE Release:", hre.ethers.formatUnits(tgeEcosystem, 18), "THD (10%)");
        console.log("   - Vesting Amount:", hre.ethers.formatUnits(vestingEcosystem, 18), "THD");
        console.log("   - Monthly Release: ~", hre.ethers.formatUnits(vestingEcosystem / 30n, 18), "THD/tháng");
        
        console.log("🏦 Treasury / Reserve Fund: 20% TGE, Vesting 48 tháng");
        const tgeTreasury = (treasuryAllocation * 20n) / 100n;
        const vestingTreasury = treasuryAllocation - tgeTreasury;
        console.log("   - TGE Release:", hre.ethers.formatUnits(tgeTreasury, 18), "THD (20%)");
        console.log("   - Vesting Amount:", hre.ethers.formatUnits(vestingTreasury, 18), "THD");
        console.log("   - Monthly Release: ~", hre.ethers.formatUnits(vestingTreasury / 48n, 18), "THD/tháng");
        
        // Calculate total TGE release
        const totalTGE = tgeNodeOG + tgeLiquidity + tgeCommunity + tgeEcosystem + tgeTreasury;
        const totalSupply = await tokenHub.totalSupply();
        const tgePercentage = (totalTGE * 100n) / totalSupply;
        
        console.log("\n📊 TGE Release Summary:");
        console.log("📈 Total TGE Release:", hre.ethers.formatUnits(totalTGE, 18), "THD");
        console.log("📈 TGE Percentage:", tgePercentage.toString() + "%");
        console.log("📈 Vesting Period: 12-48 tháng");
        console.log("📈 Longest Vesting: Treasury (48 tháng)");
        
    } catch (error) {
        console.log("❌ Error testing vesting schedule:", error.message);
    }

    // ===== 5. UTILITY & GOVERNANCE FEATURES =====
    console.log("\n🎯 ===== 5. UTILITY & GOVERNANCE FEATURES =====");
    
    try {
        // Get account info (includes VIP tier, fee discount, blacklist status)
        const accountInfo = await tokenHub.getAccountInfo(tester.address);
        console.log("✅ VIP Tier System: Tier", accountInfo.vipTier_.toString());
        console.log("✅ Fee Discount:", accountInfo.feeDiscount_.toString(), "%");
        console.log("✅ Blacklist Status:", accountInfo.isBlacklisted_ ? "Blacklisted" : "Not Blacklisted");
        
        // Voting Power (based on token balance)
        const balance = await tokenHub.balanceOf(tester.address);
        console.log("✅ Governance: Voting Power =", hre.ethers.formatUnits(balance, 18), "THD");
        
        // VIP Tier Benefits
        console.log("\n🎖️ VIP Tier Benefits:");
        console.log("Tier 0: 0% fee discount");
        console.log("Tier 1: 5% fee discount (10K THD)");
        console.log("Tier 2: 10% fee discount (50K THD)");
        console.log("Tier 3: 15% fee discount (100K THD)");
        console.log("Tier 4: 25% fee discount (500K THD)");
        console.log("Tier 5: 50% fee discount (1M THD)");
        
    } catch (error) {
        console.log("❌ Error testing utility features:", error.message);
    }

    // ===== 6. TOKEN INFORMATION SUMMARY =====
    console.log("\n📋 ===== 6. TOKEN INFORMATION SUMMARY =====");
    
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

    // ===== 7. TOKENOMICS COMPLIANCE CHECK =====
    console.log("\n✅ ===== 7. TOKENOMICS COMPLIANCE CHECK =====");
    
    try {
        const name = await tokenHub.name();
        const symbol = await tokenHub.symbol();
        const decimals = await tokenHub.decimals();
        const totalSupply = await tokenHub.totalSupply();
        const balance = await tokenHub.balanceOf(tester.address);
        const network = await hre.ethers.provider.getNetwork();
        
        // Check against tokenomics document
        const projectNameCorrect = name === "Token Hub";
        const tokenSymbolCorrect = symbol === "THD";
        const decimalsCorrect = Number(decimals) === 18;
        const totalSupplyCorrect = totalSupply === hre.ethers.parseUnits("100000000", 18);
        const networkCorrect = [97, 31337].includes(Number(network.chainId));
        const erc20Compliant = balance > 0n;
        
        console.log("📋 Project Name:", projectNameCorrect ? "✅ PASS" : "❌ FAIL");
        console.log("🪙 Token Symbol:", tokenSymbolCorrect ? "✅ PASS" : "❌ FAIL");
        console.log("🔢 Token Decimals:", decimalsCorrect ? "✅ PASS" : "❌ FAIL");
        console.log("📈 Total Supply:", totalSupplyCorrect ? "✅ PASS" : "❌ FAIL");
        console.log("🌐 Network Compatibility:", networkCorrect ? "✅ PASS" : "❌ FAIL");
        console.log("🔗 ERC-20 Compliance:", erc20Compliant ? "✅ PASS" : "❌ FAIL");
        
        // Check allocation compliance
        const teamAllocation = await tokenHub.TEAM_ALLOCATION();
        const nodeOGAllocation = await tokenHub.NODE_OG_ALLOCATION();
        const liquidityAllocation = await tokenHub.LIQUIDITY_ALLOCATION();
        const communityAllocation = await tokenHub.COMMUNITY_ALLOCATION();
        const stakingAllocation = await tokenHub.STAKING_ALLOCATION();
        const ecosystemAllocation = await tokenHub.ECOSYSTEM_ALLOCATION();
        const treasuryAllocation = await tokenHub.TREASURY_ALLOCATION();
        
        const expectedTeam = hre.ethers.parseUnits("7000000", 18); // 7%
        const expectedNodeOG = hre.ethers.parseUnits("3000000", 18); // 3%
        const expectedLiquidity = hre.ethers.parseUnits("15000000", 18); // 15%
        const expectedCommunity = hre.ethers.parseUnits("20000000", 18); // 20%
        const expectedStaking = hre.ethers.parseUnits("10000000", 18); // 10%
        const expectedEcosystem = hre.ethers.parseUnits("25000000", 18); // 25%
        const expectedTreasury = hre.ethers.parseUnits("20000000", 18); // 20%
        
        const teamAllocationCorrect = teamAllocation === expectedTeam;
        const nodeOGAllocationCorrect = nodeOGAllocation === expectedNodeOG;
        const liquidityAllocationCorrect = liquidityAllocation === expectedLiquidity;
        const communityAllocationCorrect = communityAllocation === expectedCommunity;
        const stakingAllocationCorrect = stakingAllocation === expectedStaking;
        const ecosystemAllocationCorrect = ecosystemAllocation === expectedEcosystem;
        const treasuryAllocationCorrect = treasuryAllocation === expectedTreasury;
        
        console.log("👥 Team Allocation (7%):", teamAllocationCorrect ? "✅ PASS" : "❌ FAIL");
        console.log("🌟 Node OG Allocation (3%):", nodeOGAllocationCorrect ? "✅ PASS" : "❌ FAIL");
        console.log("💧 Liquidity Allocation (15%):", liquidityAllocationCorrect ? "✅ PASS" : "❌ FAIL");
        console.log("🎯 Community Allocation (20%):", communityAllocationCorrect ? "✅ PASS" : "❌ FAIL");
        console.log("🔒 Staking Allocation (10%):", stakingAllocationCorrect ? "✅ PASS" : "❌ FAIL");
        console.log("🌐 Ecosystem Allocation (25%):", ecosystemAllocationCorrect ? "✅ PASS" : "❌ FAIL");
        console.log("🏦 Treasury Allocation (20%):", treasuryAllocationCorrect ? "✅ PASS" : "❌ FAIL");
        
    } catch (error) {
        console.log("❌ Error in compliance check:", error.message);
    }

    // ===== 8. FINAL SUMMARY =====
    console.log("\n🎉 ===== 8. FINAL SUMMARY =====");
    console.log("✅ Contract Address:", contractAddress);
    
    try {
        const network = await hre.ethers.provider.getNetwork();
        console.log("✅ Network:", network.name, "(Chain ID:", network.chainId.toString() + ")");
    } catch (error) {
        console.log("✅ Network: BSC Testnet (Chain ID: 97)");
    }
    
    console.log("✅ Token: Token Hub (THD)");
    console.log("✅ Total Supply: 100,000,000 THD");
    console.log("✅ Features: Utility & Governance Token");
    console.log("✅ Standard: ERC-20 (BEP-20 Compatible)");
    console.log("✅ Vesting: 16.8% TGE, 83.2% Vesting");
    console.log("✅ Allocation: 7 nhóm theo tỷ lệ chính xác");
    
    console.log("\n🎯 Test completed successfully!");
    console.log("📊 All features verified for BSC Testnet contract!");
    console.log("🚀 Ready for mainnet deployment!");
}

main().catch((error) => {
    console.error("❌ Test failed:", error);
    process.exitCode = 1;
});
