const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Testnet addresses
const TESTNET_ADDRESSES = {
    BSC_TESTNET: {
        BUSD: "0x78867BbEeF44f2326bF8DDd1941a4439382EF2A7",
        USDT: "0x7ef95a0FEE0Dd31b22626fA2e10Ee6A223F8a684",
        PANCAKE_ROUTER: "0xD99D1c33F9fC3444f8101754aBC46c52416550D1",
        BNB_USD_ORACLE: "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526",
        BUSD_USD_ORACLE: "0x9331b55D9830EF609A2aBCfAc0FBCE050A52fdEa"
    },
    ETHEREUM_GOERLI: {
        USDC: "0x07865c6E87B9F70255377e024ace6630C1Eaa37F",
        USDT: "0x509Ee0d083DdF8AC028f2a56731412edD63223B9",
        UNISWAP_ROUTER: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
        ETH_USD_ORACLE: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e"
    }
};

async function main() {
    console.log("🧪 Deploying Test Token Ecosystem to Testnet...");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("📋 Deploying contracts with account:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");

    // Get network info
    const network = await hre.ethers.provider.getNetwork();
    const networkName = hre.network.name;
    const chainId = network.chainId.toString();
    
    console.log(`🌐 Network: ${networkName} (Chain ID: ${chainId})`);

    // Get testnet addresses based on network
    let testnetAddresses;
    if (chainId === "97") { // BSC Testnet
        testnetAddresses = TESTNET_ADDRESSES.BSC_TESTNET;
    } else if (chainId === "5") { // Ethereum Goerli
        testnetAddresses = TESTNET_ADDRESSES.ETHEREUM_GOERLI;
    } else {
        console.log("⚠️  Using mock addresses for local network");
        testnetAddresses = {
            BUSD: "0x78867BbEeF44f2326bF8DDd1941a4439382EF2A7",
            PANCAKE_ROUTER: "0xD99D1c33F9fC3444f8101754aBC46c52416550D1",
            BNB_USD_ORACLE: "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526"
        };
    }

    const deploymentInfo = {
        network: networkName,
        chainId: chainId,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        environment: "testnet",
        contracts: {},
        tokenInfo: {},
        testnetAddresses: testnetAddresses
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
            testnetAddresses.BUSD,
            testnetAddresses.PANCAKE_ROUTER,
            testnetAddresses.BNB_USD_ORACLE,
            deployer.address
        );
        await buybackBurn.waitForDeployment();

        const buybackBurnAddress = await buybackBurn.getAddress();
        deploymentInfo.contracts.TestTokenBuybackBurn = buybackBurnAddress;
        console.log("✅ TestTokenBuybackBurn deployed at:", buybackBurnAddress);

        // ===== Setup Contract Connections ======
        console.log("\n🔗 Setting up contract connections...");
        
        await testToken.setVestingContract(vestingAddress);
        await testToken.setStakingContract(stakingAddress);
        await testToken.setGovernanceContract(governanceAddress);
        await testToken.setBuybackContract(buybackBurnAddress);
        
        console.log("✅ Contract connections established");

        // ===== Setup Test Scenarios ======
        console.log("\n🧪 Setting up test scenarios...");
        
        // Create test vesting schedules
        const vestingAmounts = {
            team: hre.ethers.parseEther("7000000"), // 7M THB
            nodeOG: hre.ethers.parseEther("3000000"), // 3M THB
            liquidity: hre.ethers.parseEther("15000000"), // 15M THB
            community: hre.ethers.parseEther("20000000"), // 20M THB
            staking: hre.ethers.parseEther("10000000"), // 10M THB
            ecosystem: hre.ethers.parseEther("25000000"), // 25M THB
            treasury: hre.ethers.parseEther("20000000") // 20M THB
        };

        // Approve vesting contract
        await testToken.approve(vestingAddress, hre.ethers.parseEther("100000000"));

        // Create vesting schedules
        await vesting.createVestingSchedule(
            deployer.address, // Team address
            vestingAmounts.team,
            0, // 0% TGE
            6 * 30 * 24 * 60 * 60, // 6 months cliff
            36 * 30 * 24 * 60 * 60, // 36 months vesting
            "Team"
        );

        await vesting.createVestingSchedule(
            deployer.address, // Node OG address
            vestingAmounts.nodeOG,
            10, // 10% TGE
            0, // No cliff
            24 * 30 * 24 * 60 * 60, // 24 months vesting
            "Node OG"
        );

        await vesting.createVestingSchedule(
            deployer.address, // Liquidity address
            vestingAmounts.liquidity,
            40, // 40% TGE
            0, // No cliff
            12 * 30 * 24 * 60 * 60, // 12 months vesting
            "Liquidity"
        );

        console.log("✅ Test vesting schedules created");

        // Setup staking rewards
        await testToken.mint(stakingAddress, hre.ethers.parseEther("1000000"), "Staking rewards");
        console.log("✅ Staking rewards funded");

        // Create test governance proposal
        await governance.propose("Test proposal for testnet deployment");
        console.log("✅ Test governance proposal created");

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

        // ===== Display Contract Addresses ======
        console.log("\n📍 Contract Addresses:");
        console.log("  TestToken:", testTokenAddress);
        console.log("  Vesting:", vestingAddress);
        console.log("  Staking:", stakingAddress);
        console.log("  Governance:", governanceAddress);
        console.log("  BuybackBurn:", buybackBurnAddress);

        // ===== Display Testnet Addresses ======
        console.log("\n🧪 Testnet Addresses Used:");
        console.log("  Stablecoin (BUSD):", testnetAddresses.BUSD);
        console.log("  Router:", testnetAddresses.PANCAKE_ROUTER);
        console.log("  Oracle:", testnetAddresses.BNB_USD_ORACLE);

        // ===== Save Deployment Info ======
        const deploymentDir = path.join(__dirname, "..", "deployments");
        if (!fs.existsSync(deploymentDir)) {
            fs.mkdirSync(deploymentDir, { recursive: true });
        }

        const deploymentFile = path.join(deploymentDir, `${networkName}_testnet_${Date.now()}.json`);
        fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

        console.log("\n💾 Testnet deployment completed successfully!");
        console.log("📄 Deployment info saved to:", deploymentFile);
        
        // ===== Display Test Instructions ======
        console.log("\n🧪 Test Instructions:");
        console.log("1. Get testnet BUSD from faucet");
        console.log("2. Test buyback functionality");
        console.log("3. Test staking and rewards");
        console.log("4. Test governance voting");
        console.log("5. Test vesting releases");
        console.log("6. Verify all contract interactions");

        return deploymentInfo;

    } catch (error) {
        console.error("❌ Testnet deployment failed:", error);
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
