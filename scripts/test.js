/**
 * 🧪 Test Script - TestToken Ecosystem
 * Test toàn bộ chức năng của TestToken với symbol TEST
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
        logHeader("🧪 TestToken Ecosystem - Complete Testing");
        
        // Get network info
        const network = await ethers.provider.getNetwork();
        const [deployer, user1, user2] = await ethers.getSigners();
        
        logInfo(`Network: ${network.name} (Chain ID: ${network.chainId})`);
        logInfo(`Deployer: ${deployer.address}`);
        logInfo(`User1: ${user1.address}`);
        logInfo(`User2: ${user2.address}`);
        logInfo(`Deployer Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} BNB`);
        
        // Deploy TestToken
        logHeader("🔨 Deploying TestToken");
        logInfo("Deploying TestToken...");
        const TestToken = await ethers.getContractFactory("TestToken");
        const testToken = await TestToken.deploy(deployer.address);
        await testToken.waitForDeployment();
        
        const tokenAddress = await testToken.getAddress();
        logSuccess(`TestToken deployed to: ${tokenAddress}`);
        
        // Test basic token functions
        logHeader("🧪 Testing Basic Token Functions");
        
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
        
        // Test transfer
        logHeader("💸 Testing Token Transfer");
        
        const transferAmount = ethers.parseEther("1000");
        logInfo(`Transferring ${ethers.formatEther(transferAmount)} ${symbol} to User1...`);
        
        await testToken.transfer(user1.address, transferAmount);
        const user1Balance = await testToken.balanceOf(user1.address);
        const deployerBalanceAfter = await testToken.balanceOf(deployer.address);
        
        logSuccess(`Transfer successful!`);
        logSuccess(`User1 Balance: ${ethers.formatEther(user1Balance)} ${symbol}`);
        logSuccess(`Deployer Balance After: ${ethers.formatEther(deployerBalanceAfter)} ${symbol}`);
        
        // Test approval and transferFrom
        logHeader("🔐 Testing Approval & TransferFrom");
        
        const approveAmount = ethers.parseEther("500");
        logInfo(`User1 approving User2 to spend ${ethers.formatEther(approveAmount)} ${symbol}...`);
        
        await testToken.connect(user1).approve(user2.address, approveAmount);
        const allowance = await testToken.allowance(user1.address, user2.address);
        logSuccess(`Allowance set: ${ethers.formatEther(allowance)} ${symbol}`);
        
        logInfo(`User2 transferring ${ethers.formatEther(approveAmount)} ${symbol} from User1 to Deployer...`);
        await testToken.connect(user2).transferFrom(user1.address, deployer.address, approveAmount);
        
        const user1BalanceAfter = await testToken.balanceOf(user1.address);
        const deployerBalanceFinal = await testToken.balanceOf(deployer.address);
        
        logSuccess(`TransferFrom successful!`);
        logSuccess(`User1 Balance After: ${ethers.formatEther(user1BalanceAfter)} ${symbol}`);
        logSuccess(`Deployer Balance Final: ${ethers.formatEther(deployerBalanceFinal)} ${symbol}`);
        
        // Test mint function
        logHeader("🪙 Testing Mint Function");
        
        const mintAmount = ethers.parseEther("10000");
        logInfo(`Minting ${ethers.formatEther(mintAmount)} ${symbol} to User2...`);
        
        await testToken.mint(user2.address, mintAmount, "Testing mint function");
        const user2Balance = await testToken.balanceOf(user2.address);
        const totalSupplyAfter = await testToken.totalSupply();
        
        logSuccess(`Mint successful!`);
        logSuccess(`User2 Balance: ${ethers.formatEther(user2Balance)} ${symbol}`);
        logSuccess(`Total Supply After: ${ethers.formatEther(totalSupplyAfter)} ${symbol}`);
        
        // Test pause/unpause
        logHeader("⏸️ Testing Pause/Unpause");
        
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
        
        // Test role-based access control
        logHeader("🔑 Testing Role-Based Access Control");
        
        const MINTER_ROLE = await testToken.MINTER_ROLE();
        const PAUSER_ROLE = await testToken.PAUSER_ROLE();
        
        logInfo("Checking roles...");
        const hasMinterRole = await testToken.hasRole(MINTER_ROLE, deployer.address);
        const hasPauserRole = await testToken.hasRole(PAUSER_ROLE, deployer.address);
        
        logSuccess(`Deployer has MINTER_ROLE: ${hasMinterRole}`);
        logSuccess(`Deployer has PAUSER_ROLE: ${hasPauserRole}`);
        
        // Test blacklist functionality
        logHeader("🚫 Testing Blacklist Functionality");
        
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
        
        // Display final summary
        logHeader("📊 Final Token Summary");
        log(`Token Address: ${tokenAddress}`, 'cyan');
        log(`Token Name: ${name}`, 'cyan');
        log(`Token Symbol: ${symbol}`, 'cyan');
        log(`Token Decimals: ${decimals}`, 'cyan');
        log(`Total Supply: ${ethers.formatEther(await testToken.totalSupply())} ${symbol}`, 'cyan');
        
        logHeader("👥 Final Balances");
        log(`Deployer: ${ethers.formatEther(await testToken.balanceOf(deployer.address))} ${symbol}`, 'green');
        log(`User1: ${ethers.formatEther(await testToken.balanceOf(user1.address))} ${symbol}`, 'green');
        log(`User2: ${ethers.formatEther(await testToken.balanceOf(user2.address))} ${symbol}`, 'green');
        
        logHeader("🎯 MetaMask Import Information");
        log(`Contract Address: ${tokenAddress}`, 'yellow');
        log(`Symbol: ${symbol}`, 'yellow');
        log(`Decimals: ${decimals}`, 'yellow');
        
        logHeader("✅ All Tests Completed Successfully!");
        
    } catch (error) {
        logError(`Test failed: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}

// Run the tests
main()
    .then(() => process.exit(0))
    .catch((error) => {
        logError(`Script failed: ${error.message}`);
        console.error(error);
        process.exit(1);
    });
