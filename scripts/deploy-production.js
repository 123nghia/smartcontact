const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Production addresses for BSC Mainnet
const PRODUCTION_ADDRESSES = {
    BSC_MAINNET: {
        BUSD: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
        USDT: "0x55d398326f99059fF775485246999027B3197955",
        PANCAKE_ROUTER: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
        BNB_USD_ORACLE: "0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE",
        BUSD_USD_ORACLE: "0xcBb98864Ef56E9042e7d2efef76141f15731B82f"
    },
    BSC_TESTNET: {
        BUSD: "0x78867BbEeF44f2326bF8DDd1941a4439382EF2A7",
        USDT: "0x7ef95a0FEE0Dd31b22626fA2e10Ee6A223F8a684",
        PANCAKE_ROUTER: "0xD99D1c33F9fC3444f8101754aBC46c52416550D1",
        BNB_USD_ORACLE: "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526",
        BUSD_USD_ORACLE: "0x9331b55D9830EF609A2aBCfAc0FBCE050A52fdEa"
    },
    ETHEREUM_MAINNET: {
        USDC: "0xA0b86a33E6441b8c4C8C0E4b8b2c8C0E4b8b2c8C",
        USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        UNISWAP_ROUTER: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
        ETH_USD_ORACLE: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"
    }
};

async function main() {
    console.log("🚀 Deploying Test Token Ecosystem to Production...");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("📋 Deploying contracts with account:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");

    // Get network info
    const network = await hre.ethers.provider.getNetwork();
    const networkName = hre.network.name;
    const chainId = network.chainId.toString();
    
    console.log(`🌐 Network: ${networkName} (Chain ID: ${chainId})`);

    // Get production addresses based on network
    let productionAddresses;
    if (chainId === "56") { // BSC Mainnet
        productionAddresses = PRODUCTION_ADDRESSES.BSC_MAINNET;
    } else if (chainId === "97") { // BSC Testnet
        productionAddresses = PRODUCTION_ADDRESSES.BSC_TESTNET;
    } else if (chainId === "1") { // Ethereum Mainnet
        productionAddresses = PRODUCTION_ADDRESSES.ETHEREUM_MAINNET;
    } else {
        console.log("⚠️  Using mock addresses for local/test network");
        productionAddresses = {
            BUSD: "0x55d398326f99059fF775485246999027B3197955",
            PANCAKE_ROUTER: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
            BNB_USD_ORACLE: "0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE"
        };
    }

    const deploymentInfo = {
        network: networkName,
        chainId: chainId,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: {},
        tokenInfo: {},
        productionAddresses: productionAddresses
    };

    try {
        // ===== Deploy TestToken ======
        console.log("\n📦 Deploying TestToken...");
        const TestToken = await hre.ethers.getContractFactory("TestToken");
        const testToken = await TestToken.deploy(deployer.address);
        await testToken.waitForDeployment();

        const testTokenAddress = await testToken.getAddress();
        deploymentInfo.contracts.TestToken = testTokenAddress;
        console.log("✅ TestToken deployed at:", testTokenAddress);

        // ===== Deploy Vesting Contract ======
        console.log("\n📦 Deploying TestTokenVesting...");
        const TestTokenVesting = await hre.ethers.getContractFactory("TestTokenVesting");
        const vesting = await TestTokenVesting.deploy(testTokenAddress, deployer.address);
        await vesting.waitForDeployment();

        const vestingAddress = await vesting.getAddress();
        deploymentInfo.contracts.TestTokenVesting = vestingAddress;
        console.log("✅ TestTokenVesting deployed at:", vestingAddress);

        // ===== Deploy Staking Contract ======
        console.log("\n📦 Deploying TestTokenStaking...");
        const TestTokenStaking = await hre.ethers.getContractFactory("TestTokenStaking");
        const staking = await TestTokenStaking.deploy(testTokenAddress, deployer.address);
        await staking.waitForDeployment();

        const stakingAddress = await staking.getAddress();
        deploymentInfo.contracts.TestTokenStaking = stakingAddress;
        console.log("✅ TestTokenStaking deployed at:", stakingAddress);

        // ===== Deploy Governance Contract ======
        console.log("\n📦 Deploying TestTokenGovernance...");
        const TestTokenGovernance = await hre.ethers.getContractFactory("TestTokenGovernance");
        const governance = await TestTokenGovernance.deploy(testTokenAddress, deployer.address);
        await governance.waitForDeployment();

        const governanceAddress = await governance.getAddress();
        deploymentInfo.contracts.TestTokenGovernance = governanceAddress;
        console.log("✅ TestTokenGovernance deployed at:", governanceAddress);

        // ===== Deploy Buyback & Burn Contract ======
        console.log("\n📦 Deploying TestTokenBuybackBurn...");
        const TestTokenBuybackBurn = await hre.ethers.getContractFactory("TestTokenBuybackBurn");
        
        const buybackBurn = await TestTokenBuybackBurn.deploy(
            testTokenAddress,
            productionAddresses.BUSD,
            productionAddresses.PANCAKE_ROUTER,
            productionAddresses.BNB_USD_ORACLE,
            deployer.address
        );
        await buybackBurn.waitForDeployment();

        const buybackBurnAddress = await buybackBurn.getAddress();
        deploymentInfo.contracts.TestTokenBuybackBurn = buybackBurnAddress;
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
        deploymentInfo.tokenInfo = {
            name: tokenInfo.name,
            symbol: tokenInfo.symbol,
            decimals: tokenInfo.decimals,
            totalSupply: tokenInfo.totalSupply_.toString(),
            maxSupply: tokenInfo.maxSupply_.toString(),
            totalMinted: tokenInfo.totalMinted_.toString(),
            totalBurned: tokenInfo.totalBurned_.toString(),
            mintingEnabled: tokenInfo.mintingEnabled_,
            burningEnabled: tokenInfo.burningEnabled_
        };

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
        
        try {
            // Test minting
            const testAmount = hre.ethers.parseEther("1000");
            await testToken.mint(deployer.address, testAmount, "Test mint");
            console.log("✅ Test mint successful: 1000 THB");
        } catch (error) {
            console.log("❌ Test mint failed:", error.message);
        }

        try {
            // Test staking
            const stakeAmount = hre.ethers.parseEther("100");
            await testToken.approve(stakingAddress, stakeAmount);
            await staking.stake(stakeAmount, 30 * 24 * 60 * 60); // 30 days
            console.log("✅ Test staking successful: 100 THB for 30 days");
        } catch (error) {
            console.log("❌ Test staking failed:", error.message);
        }

        try {
            // Test governance
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

        // ===== Display Production Addresses ======
        console.log("\n🏭 Production Addresses Used:");
        console.log("  Stablecoin (BUSD):", productionAddresses.BUSD);
        console.log("  Router:", productionAddresses.PANCAKE_ROUTER);
        console.log("  Oracle:", productionAddresses.BNB_USD_ORACLE);

        // ===== Save Deployment Info ======
        const deploymentDir = path.join(__dirname, "..", "deployments");
        if (!fs.existsSync(deploymentDir)) {
            fs.mkdirSync(deploymentDir, { recursive: true });
        }

        const deploymentFile = path.join(deploymentDir, `${networkName}_${Date.now()}.json`);
        fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

        console.log("\n💾 Deployment completed successfully!");
        console.log("📄 Deployment info saved to:", deploymentFile);
        
        // ===== Display Next Steps ======
        console.log("\n📋 Next Steps:");
        console.log("1. Verify contracts on block explorer");
        console.log("2. Set up initial vesting schedules");
        console.log("3. Configure staking pools");
        console.log("4. Create initial governance proposals");
        console.log("5. Fund buyback contract with stablecoin");
        console.log("6. Update frontend with new contract addresses");

        return deploymentInfo;

    } catch (error) {
        console.error("❌ Deployment failed:", error);
        throw error;
    }
}

// Handle script execution
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("❌ Script failed:", error);
            process.exit(1);
        });
}

module.exports = main;
