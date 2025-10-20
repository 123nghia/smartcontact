/**
 * 🚀 BSC Testnet Deployment Script
 * Deploy TestToken Ecosystem lên BSC Testnet
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

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
    log(`\n${'='.repeat(70)}`, 'cyan');
    log(title, 'bright');
    log('='.repeat(70), 'cyan');
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
        logHeader("🚀 BSC Testnet Deployment - TestToken Ecosystem");
        
        // Get network info
        const network = await ethers.provider.getNetwork();
        const [deployer] = await ethers.getSigners();
        
        logInfo(`Network: ${network.name} (Chain ID: ${network.chainId})`);
        logInfo(`Deployer: ${deployer.address}`);
        logInfo(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} BNB`);
        
        // Check balance
        const balance = await ethers.provider.getBalance(deployer.address);
        if (balance < ethers.parseEther("0.1")) {
            logError("Insufficient BNB balance! Need at least 0.1 BNB for deployment.");
            logInfo("Get BNB from: https://testnet.binance.org/faucet-smart");
            process.exit(1);
        }
        
        const deployedContracts = {};
        const deploymentInfo = {
            network: network.name,
            chainId: network.chainId.toString(),
            deployer: deployer.address,
            timestamp: new Date().toISOString(),
            contracts: {}
        };
        
        logHeader("🔨 Phase 1: Deploying TestToken");
        
        // Deploy TestToken
        logInfo("Deploying TestToken...");
        const TestToken = await ethers.getContractFactory("TestToken");
        const testToken = await TestToken.deploy(deployer.address);
        await testToken.waitForDeployment();
        
        const tokenAddress = await testToken.getAddress();
        deployedContracts.TestToken = tokenAddress;
        deploymentInfo.contracts.TestToken = {
            address: tokenAddress,
            name: "TestToken",
            symbol: "TEST"
        };
        logSuccess(`TestToken deployed to: ${tokenAddress}`);
        
        // Test basic functions
        const name = await testToken.name();
        const symbol = await testToken.symbol();
        const decimals = await testToken.decimals();
        const totalSupply = await testToken.totalSupply();
        
        logSuccess(`Name: ${name}`);
        logSuccess(`Symbol: ${symbol}`);
        logSuccess(`Decimals: ${decimals}`);
        logSuccess(`Total Supply: ${ethers.formatEther(totalSupply)} ${symbol}`);
        
        logHeader("🔨 Phase 2: Deploying Ecosystem Contracts");
        
        // Deploy TestTokenVesting
        logInfo("Deploying TestTokenVesting...");
        const TestTokenVesting = await ethers.getContractFactory("TestTokenVesting");
        const vesting = await TestTokenVesting.deploy(tokenAddress, deployer.address);
        await vesting.waitForDeployment();
        
        const vestingAddress = await vesting.getAddress();
        deployedContracts.TestTokenVesting = vestingAddress;
        deploymentInfo.contracts.TestTokenVesting = {
            address: vestingAddress,
            name: "TestTokenVesting"
        };
        logSuccess(`TestTokenVesting deployed to: ${vestingAddress}`);
        
        // Deploy TestTokenStaking
        logInfo("Deploying TestTokenStaking...");
        const TestTokenStaking = await ethers.getContractFactory("TestTokenStaking");
        const staking = await TestTokenStaking.deploy(tokenAddress, deployer.address);
        await staking.waitForDeployment();
        
        const stakingAddress = await staking.getAddress();
        deployedContracts.TestTokenStaking = stakingAddress;
        deploymentInfo.contracts.TestTokenStaking = {
            address: stakingAddress,
            name: "TestTokenStaking"
        };
        logSuccess(`TestTokenStaking deployed to: ${stakingAddress}`);
        
        // Deploy TestTokenGovernance
        logInfo("Deploying TestTokenGovernance...");
        const TestTokenGovernance = await ethers.getContractFactory("TestTokenGovernance");
        const governance = await TestTokenGovernance.deploy(tokenAddress, deployer.address);
        await governance.waitForDeployment();
        
        const governanceAddress = await governance.getAddress();
        deployedContracts.TestTokenGovernance = governanceAddress;
        deploymentInfo.contracts.TestTokenGovernance = {
            address: governanceAddress,
            name: "TestTokenGovernance"
        };
        logSuccess(`TestTokenGovernance deployed to: ${governanceAddress}`);
        
        // Deploy TestTokenBuybackBurn
        logInfo("Deploying TestTokenBuybackBurn...");
        const TestTokenBuybackBurn = await ethers.getContractFactory("TestTokenBuybackBurn");
        // Using mock addresses for BSC Testnet
        const mockStablecoin = "0x0000000000000000000000000000000000000001";
        const mockRouter = "0x0000000000000000000000000000000000000002";
        const mockOracle = "0x0000000000000000000000000000000000000003";
        const buybackBurn = await TestTokenBuybackBurn.deploy(
            tokenAddress, 
            mockStablecoin, 
            mockRouter, 
            mockOracle, 
            deployer.address
        );
        await buybackBurn.waitForDeployment();
        
        const buybackAddress = await buybackBurn.getAddress();
        deployedContracts.TestTokenBuybackBurn = buybackAddress;
        deploymentInfo.contracts.TestTokenBuybackBurn = {
            address: buybackAddress,
            name: "TestTokenBuybackBurn"
        };
        logSuccess(`TestTokenBuybackBurn deployed to: ${buybackAddress}`);
        
        logHeader("⚙️ Phase 3: Setting Up Roles and Permissions");
        
        // Grant roles
        logInfo("Setting up roles and permissions...");
        
        const MINTER_ROLE = await testToken.MINTER_ROLE();
        const BURNER_ROLE = await testToken.BURNER_ROLE();
        
        // Grant minter role to vesting contract
        await testToken.grantRole(MINTER_ROLE, vestingAddress);
        logSuccess("Granted MINTER_ROLE to vesting contract");
        
        // Grant burner role to buyback contract
        await testToken.grantRole(BURNER_ROLE, buybackAddress);
        logSuccess("Granted BURNER_ROLE to buyback contract");
        
        // Mint additional tokens
        logInfo("Minting additional tokens...");
        await testToken.mint(deployer.address, ethers.parseEther("10000000"), "Additional distribution");
        logSuccess(`Minted 10,000,000 additional tokens to deployer`);
        
        logHeader("📊 Phase 4: Final Summary");
        
        const finalBalance = await ethers.provider.getBalance(deployer.address);
        logInfo(`Final Balance: ${ethers.formatEther(finalBalance)} BNB`);
        
        logHeader("📋 Contract Addresses");
        Object.entries(deployedContracts).forEach(([name, address]) => {
            log(`${name}: ${address}`, 'green');
        });
        
        logHeader("🎯 MetaMask Setup Instructions");
        log("1. Add BSC Testnet to MetaMask:", 'yellow');
        log(`   - Network Name: BSC Testnet`, 'yellow');
        log(`   - RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545/`, 'yellow');
        log(`   - Chain ID: 97`, 'yellow');
        log(`   - Currency Symbol: BNB`, 'yellow');
        
        log("2. Add Test Token to MetaMask:", 'yellow');
        log(`   - Contract Address: ${tokenAddress}`, 'yellow');
        log(`   - Symbol: ${symbol}`, 'yellow');
        log(`   - Decimals: ${decimals}`, 'yellow');
        
        logHeader("🔍 BSCScan Links");
        Object.entries(deployedContracts).forEach(([name, address]) => {
            log(`${name}: https://testnet.bscscan.com/address/${address}`, 'cyan');
        });
        
        // Save deployment info
        const configDir = path.join(__dirname, '../config');
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
        
        fs.writeFileSync(
            path.join(configDir, 'contract-addresses.json'),
            JSON.stringify(deployedContracts, null, 2)
        );
        
        fs.writeFileSync(
            path.join(configDir, 'deployment-info.json'),
            JSON.stringify(deploymentInfo, null, 2)
        );
        
        logSuccess("Deployment info saved to config/ folder");
        
        logHeader("✅ BSC Testnet Deployment Completed Successfully!");
        
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
