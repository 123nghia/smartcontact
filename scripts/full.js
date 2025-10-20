/**
 * 🚀 Full Ecosystem Script - TestToken Ecosystem
 * Deploy và test toàn bộ ecosystem với symbol TEST
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
        logHeader("🚀 TestToken Ecosystem - Full Deployment & Testing");
        
        // Get network info
        const network = await ethers.provider.getNetwork();
        const [deployer, user1, user2, user3] = await ethers.getSigners();
        
        logInfo(`Network: ${network.name} (Chain ID: ${network.chainId})`);
        logInfo(`Deployer: ${deployer.address}`);
        logInfo(`User1: ${user1.address}`);
        logInfo(`User2: ${user2.address}`);
        logInfo(`User3: ${user3.address}`);
        logInfo(`Deployer Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} BNB`);
        
        // Check balance
        const balance = await ethers.provider.getBalance(deployer.address);
        if (balance === 0n) {
            logError("Account has no BNB balance!");
            logInfo("Make sure hardhat node is running and using correct network.");
            process.exit(1);
        }
        
        const deployedContracts = {};
        
        logHeader("🔨 Phase 1: Deploying All Contracts");
        
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
        
        logHeader("⚙️ Phase 2: Initializing Contracts");
        
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
        
        logHeader("🧪 Phase 3: Testing Basic Token Functions");
        
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
        
        logHeader("💸 Phase 4: Testing Token Transfers");
        
        // Test basic transfers
        const transferAmount = ethers.parseEther("1000");
        logInfo(`Transferring ${ethers.formatEther(transferAmount)} ${symbol} to User1...`);
        
        await testToken.transfer(user1.address, transferAmount);
        const user1Balance = await testToken.balanceOf(user1.address);
        logSuccess(`User1 Balance: ${ethers.formatEther(user1Balance)} ${symbol}`);
        
        // Test approval and transferFrom
        const approveAmount = ethers.parseEther("500");
        logInfo(`User1 approving User2 to spend ${ethers.formatEther(approveAmount)} ${symbol}...`);
        
        await testToken.connect(user1).approve(user2.address, approveAmount);
        await testToken.connect(user2).transferFrom(user1.address, user3.address, approveAmount);
        
        const user1BalanceAfter = await testToken.balanceOf(user1.address);
        const user3Balance = await testToken.balanceOf(user3.address);
        logSuccess(`User1 Balance After: ${ethers.formatEther(user1BalanceAfter)} ${symbol}`);
        logSuccess(`User3 Balance: ${ethers.formatEther(user3Balance)} ${symbol}`);
        
        logHeader("🪙 Phase 5: Testing Mint Function");
        
        const mintAmount = ethers.parseEther("5000");
        logInfo(`Minting ${ethers.formatEther(mintAmount)} ${symbol} to User2...`);
        
        await testToken.mint(user2.address, mintAmount, "Testing mint function");
        const user2Balance = await testToken.balanceOf(user2.address);
        logSuccess(`User2 Balance: ${ethers.formatEther(user2Balance)} ${symbol}`);
        
        logHeader("⏸️ Phase 6: Testing Pause/Unpause");
        
        logInfo("Pausing token...");
        await testToken.pause();
        logSuccess("Token paused successfully");
        
        try {
            await testToken.transfer(user1.address, ethers.parseEther("100"));
            logError("Transfer should have failed when paused!");
        } catch (error) {
            logSuccess("Transfer correctly failed when paused");
        }
        
        logInfo("Unpausing token...");
        await testToken.unpause();
        logSuccess("Token unpaused successfully");
        
        // Test transfer after unpause
        await testToken.transfer(user1.address, ethers.parseEther("100"));
        logSuccess("Transfer works after unpause");
        
        logHeader("🔑 Phase 7: Testing Role-Based Access Control");
        
        const MINTER_ROLE_CHECK = await testToken.MINTER_ROLE();
        const PAUSER_ROLE_CHECK = await testToken.PAUSER_ROLE();
        
        const hasMinterRole = await testToken.hasRole(MINTER_ROLE_CHECK, deployer.address);
        const hasPauserRole = await testToken.hasRole(PAUSER_ROLE_CHECK, deployer.address);
        
        logSuccess(`Deployer has MINTER_ROLE: ${hasMinterRole}`);
        logSuccess(`Deployer has PAUSER_ROLE: ${hasPauserRole}`);
        
        logHeader("🚫 Phase 8: Testing Blacklist Functionality");
        
        logInfo("Blacklisting User1...");
        await testToken.setBlacklisted(user1.address, true);
        logSuccess("User1 blacklisted successfully");
        
        try {
            await testToken.connect(user1).transfer(user2.address, ethers.parseEther("100"));
            logError("Transfer should have failed for blacklisted user!");
        } catch (error) {
            logSuccess("Transfer correctly failed for blacklisted user");
        }
        
        logInfo("Unblacklisting User1...");
        await testToken.setBlacklisted(user1.address, false);
        logSuccess("User1 unblacklisted successfully");
        
        // Test transfer after unblacklist
        await testToken.connect(user1).transfer(user2.address, ethers.parseEther("100"));
        logSuccess("Transfer works after unblacklist");
        
        logHeader("🏦 Phase 9: Testing Ecosystem Contracts");
        
        // Test vesting contract
        logInfo("Testing vesting contract...");
        const vestingBalance = await testToken.balanceOf(deployedContracts.TestTokenVesting);
        logSuccess(`Vesting contract balance: ${ethers.formatEther(vestingBalance)} ${symbol}`);
        
        // Test staking contract
        logInfo("Testing staking contract...");
        const stakingBalance = await testToken.balanceOf(deployedContracts.TestTokenStaking);
        logSuccess(`Staking contract balance: ${ethers.formatEther(stakingBalance)} ${symbol}`);
        
        // Test governance contract
        logInfo("Testing governance contract...");
        const governanceBalance = await testToken.balanceOf(deployedContracts.TestTokenGovernance);
        logSuccess(`Governance contract balance: ${ethers.formatEther(governanceBalance)} ${symbol}`);
        
        // Test buyback contract
        logInfo("Testing buyback contract...");
        const buybackBalance = await testToken.balanceOf(deployedContracts.TestTokenBuybackBurn);
        logSuccess(`Buyback contract balance: ${ethers.formatEther(buybackBalance)} ${symbol}`);
        
        logHeader("📊 Final Summary");
        log(`Network: ${network.name} (${network.chainId})`, 'cyan');
        log(`Deployer: ${deployer.address}`, 'cyan');
        log(`Final Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} BNB`, 'cyan');
        
        logHeader("📋 All Contract Addresses");
        Object.entries(deployedContracts).forEach(([name, address]) => {
            log(`${name}: ${address}`, 'green');
        });
        
        logHeader("👥 Final Token Balances");
        log(`Deployer: ${ethers.formatEther(await testToken.balanceOf(deployer.address))} ${symbol}`, 'green');
        log(`User1: ${ethers.formatEther(await testToken.balanceOf(user1.address))} ${symbol}`, 'green');
        log(`User2: ${ethers.formatEther(await testToken.balanceOf(user2.address))} ${symbol}`, 'green');
        log(`User3: ${ethers.formatEther(await testToken.balanceOf(user3.address))} ${symbol}`, 'green');
        
        logHeader("🎯 MetaMask Import Information");
        log(`Contract Address: ${deployedContracts.TestToken}`, 'yellow');
        log(`Symbol: ${symbol}`, 'yellow');
        log(`Decimals: ${decimals}`, 'yellow');
        
        logHeader("✅ Full Ecosystem Deployment & Testing Completed Successfully!");
        
    } catch (error) {
        logError(`Full ecosystem test failed: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}

// Run the full ecosystem
main()
    .then(() => process.exit(0))
    .catch((error) => {
        logError(`Script failed: ${error.message}`);
        console.error(error);
        process.exit(1);
    });
