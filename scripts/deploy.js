/**
 * 🚀 Deploy Script - TestToken Ecosystem
 * Deploy toàn bộ ecosystem với symbol TEST
 */

const { ethers } = require("hardhat");

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(title) {
    log(`\n${'='.repeat(60)}`, 'cyan');
    log(title, 'bright');
    log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

async function main() {
    try {
        logHeader("🚀 TestToken Ecosystem - Deploy Script");
        
        // Get network info
        const network = await ethers.provider.getNetwork();
        const [deployer] = await ethers.getSigners();
        
        logInfo(`Network: ${network.name} (Chain ID: ${network.chainId})`);
        logInfo(`Deployer: ${deployer.address}`);
        logInfo(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} BNB`);
        
        // Check balance
        const balance = await ethers.provider.getBalance(deployer.address);
        if (balance === 0n) {
            logError("Account has no BNB balance!");
            logInfo("Make sure hardhat node is running and using correct network.");
            process.exit(1);
        }
        
        const deployedContracts = {};
        
        logHeader("🔨 Deploying Contracts");
        
        // 1. Deploy TestToken
        logInfo("Deploying TestToken...");
        const TestToken = await ethers.getContractFactory("TestToken");
        const testToken = await TestToken.deploy(deployer.address);
        await testToken.waitForDeployment();
        deployedContracts.TestToken = await testToken.getAddress();
        logSuccess(`TestToken deployed to: ${deployedContracts.TestToken}`);
        
        // 2. Deploy TestTokenVesting
        logInfo("Deploying TestTokenVesting...");
        const TestTokenVesting = await ethers.getContractFactory("TestTokenVesting");
        const vesting = await TestTokenVesting.deploy(deployedContracts.TestToken, deployer.address);
        await vesting.waitForDeployment();
        deployedContracts.TestTokenVesting = await vesting.getAddress();
        logSuccess(`TestTokenVesting deployed to: ${deployedContracts.TestTokenVesting}`);
        
        // 3. Deploy TestTokenStaking
        logInfo("Deploying TestTokenStaking...");
        const TestTokenStaking = await ethers.getContractFactory("TestTokenStaking");
        const staking = await TestTokenStaking.deploy(deployedContracts.TestToken, deployer.address);
        await staking.waitForDeployment();
        deployedContracts.TestTokenStaking = await staking.getAddress();
        logSuccess(`TestTokenStaking deployed to: ${deployedContracts.TestTokenStaking}`);
        
        // 4. Deploy TestTokenGovernance
        logInfo("Deploying TestTokenGovernance...");
        const TestTokenGovernance = await ethers.getContractFactory("TestTokenGovernance");
        const governance = await TestTokenGovernance.deploy(deployedContracts.TestToken, deployer.address);
        await governance.waitForDeployment();
        deployedContracts.TestTokenGovernance = await governance.getAddress();
        logSuccess(`TestTokenGovernance deployed to: ${deployedContracts.TestTokenGovernance}`);
        
        // 5. Deploy TestTokenBuybackBurn
        logInfo("Deploying TestTokenBuybackBurn...");
        const TestTokenBuybackBurn = await ethers.getContractFactory("TestTokenBuybackBurn");
        // Using mock addresses for testing
        const mockStablecoin = "0x0000000000000000000000000000000000000001"; // Mock USDT
        const mockRouter = "0x0000000000000000000000000000000000000002"; // Mock PancakeRouter
        const mockOracle = "0x0000000000000000000000000000000000000003"; // Mock Chainlink Oracle
        const buybackBurn = await TestTokenBuybackBurn.deploy(
            deployedContracts.TestToken, 
            mockStablecoin, 
            mockRouter, 
            mockOracle, 
            deployer.address
        );
        await buybackBurn.waitForDeployment();
        deployedContracts.TestTokenBuybackBurn = await buybackBurn.getAddress();
        logSuccess(`TestTokenBuybackBurn deployed to: ${deployedContracts.TestTokenBuybackBurn}`);
        
        // Initialize contracts
        logHeader("⚙️ Initializing Contracts");
        
        // Grant roles
        logInfo("Setting up roles and permissions...");
        
        const MINTER_ROLE = await testToken.MINTER_ROLE();
        const BURNER_ROLE = await testToken.BURNER_ROLE();
        
        // Grant minter role to vesting contract
        await testToken.grantRole(MINTER_ROLE, deployedContracts.TestTokenVesting);
        logSuccess("Granted MINTER_ROLE to vesting contract");
        
        // Grant burner role to buyback contract
        await testToken.grantRole(BURNER_ROLE, deployedContracts.TestTokenBuybackBurn);
        logSuccess("Granted BURNER_ROLE to buyback contract");
        
        // Mint additional tokens
        logInfo("Minting additional tokens...");
        await testToken.mint(deployer.address, ethers.parseEther("10000000"), "Additional distribution");
        logSuccess(`Minted 10,000,000 additional tokens to deployer`);
        
        // Test basic functions
        logHeader("🧪 Testing Basic Functions");
        
        const name = await testToken.name();
        const symbol = await testToken.symbol();
        const decimals = await testToken.decimals();
        const totalSupply = await testToken.totalSupply();
        const deployerBalance = await testToken.balanceOf(deployer.address);
        
        logSuccess(`Token Name: ${name}`);
        logSuccess(`Token Symbol: ${symbol}`);
        logSuccess(`Token Decimals: ${decimals}`);
        logSuccess(`Total Supply: ${ethers.formatEther(totalSupply)} ${symbol}`);
        logSuccess(`Deployer Balance: ${ethers.formatEther(deployerBalance)} ${symbol}`);
        
        // Display summary
        logHeader("📊 Deployment Summary");
        log(`Network: ${network.name} (${network.chainId})`, 'cyan');
        log(`Deployer: ${deployer.address}`, 'cyan');
        log(`Final Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} BNB`, 'cyan');
        
        logHeader("📋 Contract Addresses");
        Object.entries(deployedContracts).forEach(([name, address]) => {
            log(`${name}: ${address}`, 'green');
        });
        
        logHeader("🎯 MetaMask Setup Instructions");
        log("1. Add network to MetaMask:", 'yellow');
        log(`   - Network Name: Hardhat Local BNB`, 'yellow');
        log(`   - RPC URL: http://127.0.0.1:8545`, 'yellow');
        log(`   - Chain ID: 31337`, 'yellow');
        log(`   - Currency Symbol: BNB`, 'yellow');
        
        log("2. Import account to MetaMask:", 'yellow');
        log(`   - Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`, 'yellow');
        
        log("3. Add Test Token to MetaMask:", 'yellow');
        log(`   - Contract Address: ${deployedContracts.TestToken}`, 'yellow');
        log(`   - Symbol: ${symbol}`, 'yellow');
        log(`   - Decimals: ${decimals}`, 'yellow');
        
        logHeader("✅ Deployment Completed Successfully!");
        
    } catch (error) {
        logError(`Deployment failed: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}

// Run the deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        logError(`Script failed: ${error.message}`);
        console.error(error);
        process.exit(1);
    });
