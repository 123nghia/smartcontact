const hre = require("hardhat");

async function main() {
    console.log("🚀 Deploying Test Token Ecosystem...");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("📋 Deploying contracts with account:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");

    // ===== Deploy TestToken ======
    console.log("\n📦 Deploying TestToken...");
    const TestToken = await hre.ethers.getContractFactory("TestToken");
    const testToken = await TestToken.deploy(deployer.address);
    await testToken.waitForDeployment();

    const testTokenAddress = await testToken.getAddress();
    console.log("✅ TestToken deployed at:", testTokenAddress);

    // ===== Deploy Vesting Contract ======
    console.log("\n📦 Deploying TestTokenVesting...");
    const TestTokenVesting = await hre.ethers.getContractFactory("TestTokenVesting");
    const vesting = await TestTokenVesting.deploy(testTokenAddress, deployer.address);
    await vesting.waitForDeployment();

    const vestingAddress = await vesting.getAddress();
    console.log("✅ TestTokenVesting deployed at:", vestingAddress);

    // ===== Deploy Staking Contract ======
    console.log("\n📦 Deploying TestTokenStaking...");
    const TestTokenStaking = await hre.ethers.getContractFactory("TestTokenStaking");
    const staking = await TestTokenStaking.deploy(testTokenAddress, deployer.address);
    await staking.waitForDeployment();

    const stakingAddress = await staking.getAddress();
    console.log("✅ TestTokenStaking deployed at:", stakingAddress);

    // ===== Deploy Governance Contract ======
    console.log("\n📦 Deploying TestTokenGovernance...");
    const TestTokenGovernance = await hre.ethers.getContractFactory("TestTokenGovernance");
    const governance = await TestTokenGovernance.deploy(testTokenAddress, deployer.address);
    await governance.waitForDeployment();

    const governanceAddress = await governance.getAddress();
    console.log("✅ TestTokenGovernance deployed at:", governanceAddress);

        // ===== Deploy Buyback & Burn Contract ======
        console.log("\n📦 Deploying TestTokenBuybackBurn...");
        const TestTokenBuybackBurn = await hre.ethers.getContractFactory("TestTokenBuybackBurn");
        
        // Mock addresses for testing (in production, use real addresses)
        const mockStablecoin = "0x55d398326f99059fF775485246999027B3197955"; // BUSD on BSC
        const mockRouter = "0x10ED43C718714eb63d5aA57B78B54704E256024E"; // PancakeSwap Router
        const mockOracle = "0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE"; // BNB/USD Oracle
        
        const buybackBurn = await TestTokenBuybackBurn.deploy(
            testTokenAddress,
            mockStablecoin,
            mockRouter,
            mockOracle,
            deployer.address
        );
        await buybackBurn.waitForDeployment();

    const buybackBurnAddress = await buybackBurn.getAddress();
    console.log("✅ TestTokenBuybackBurn deployed at:", buybackBurnAddress);

    // ===== Setup Contract Connections ======
    console.log("\n🔗 Setting up contract connections...");
    
    // Set contract addresses in TestToken
    await testToken.setVestingContract(vestingAddress);
    await testToken.setStakingContract(stakingAddress);
    await testToken.setGovernanceContract(governanceAddress);
    await testToken.setBuybackContract(buybackBurnAddress);
    
    console.log("✅ Contract connections established");

    // ===== Display Token Information ======
    console.log("\n📊 Token Information:");
    const tokenInfo = await testToken.getTokenInfo();
    console.log("  Name:", tokenInfo.name);
    console.log("  Symbol:", tokenInfo.symbol);
    console.log("  Decimals:", tokenInfo.decimals);
    console.log("  Total Supply:", hre.ethers.formatEther(tokenInfo.totalSupply_), "THB");
    console.log("  Max Supply:", hre.ethers.formatEther(tokenInfo.maxSupply_), "THB");
    console.log("  Total Minted:", hre.ethers.formatEther(tokenInfo.totalMinted_), "THB");
    console.log("  Total Burned:", hre.ethers.formatEther(tokenInfo.totalBurned_), "THB");
    console.log("  Minting Enabled:", tokenInfo.mintingEnabled_);
    console.log("  Burning Enabled:", tokenInfo.burningEnabled_);

    // ===== Test Basic Functionality ======
    console.log("\n🧪 Testing basic functionality...");
    
    // Test minting
    try {
        const testAmount = hre.ethers.parseEther("1000");
        await testToken.mint(deployer.address, testAmount, "Test mint");
        console.log("✅ Test mint successful: 1000 THB");
    } catch (error) {
        console.log("❌ Test mint failed:", error.message);
    }

    // Test staking
    try {
        const stakeAmount = hre.ethers.parseEther("100");
        await testToken.approve(stakingAddress, stakeAmount);
        await staking.stake(stakeAmount, 30 * 24 * 60 * 60); // 30 days
        console.log("✅ Test staking successful: 100 THB for 30 days");
    } catch (error) {
        console.log("❌ Test staking failed:", error.message);
    }

    // Test governance
    try {
        await governance.propose("Test proposal for ecosystem");
        console.log("✅ Test proposal created successfully");
    } catch (error) {
        console.log("❌ Test proposal failed:", error.message);
    }

    // ===== Display Contract Addresses ======
    console.log("\n📍 Contract Addresses:");
    console.log("  TestToken:", testTokenAddress);
    console.log("  Vesting:", vestingAddress);
    console.log("  Staking:", stakingAddress);
    console.log("  Governance:", governanceAddress);
    console.log("  BuybackBurn:", buybackBurnAddress);

    // ===== Save Deployment Info ======
    const deploymentInfo = {
        network: hre.network.name,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: {
            TestToken: testTokenAddress,
            TestTokenVesting: vestingAddress,
            TestTokenStaking: stakingAddress,
            TestTokenGovernance: governanceAddress,
            TestTokenBuybackBurn: buybackBurnAddress
        },
        tokenInfo: {
            name: tokenInfo.name,
            symbol: tokenInfo.symbol,
            decimals: tokenInfo.decimals,
            totalSupply: tokenInfo.totalSupply_.toString(),
            maxSupply: tokenInfo.maxSupply_.toString()
        }
    };

    console.log("\n💾 Deployment completed successfully!");
    console.log("📄 Deployment info saved to deployment info");
    
    return deploymentInfo;
}

main().catch((error) => {
    console.error("❌ Deploy failed:", error);
    process.exitCode = 1;
});
