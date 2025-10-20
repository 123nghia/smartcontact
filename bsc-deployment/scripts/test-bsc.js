/**
 * 🧪 BSC Testnet Testing Script
 * Test tất cả functions của TestToken trên BSC Testnet
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
        logHeader("🧪 BSC Testnet Testing - TestToken Ecosystem");
        
        // Check if deployment info exists
        const configPath = path.join(__dirname, '../config/contract-addresses.json');
        if (!fs.existsSync(configPath)) {
            logError("Contract addresses file not found!");
            logInfo("Please run deployment script first: npm run deploy:bsc");
            process.exit(1);
        }
        
        const contractAddresses = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // Get network info
        const network = await ethers.provider.getNetwork();
        const [deployer, user1, user2] = await ethers.getSigners();
        
        logInfo(`Network: ${network.name} (Chain ID: ${network.chainId})`);
        logInfo(`Deployer: ${deployer.address}`);
        logInfo(`User1: ${user1.address}`);
        logInfo(`User2: ${user2.address}`);
        logInfo(`Deployer Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} BNB`);
        
        logHeader("🔗 Connecting to Deployed Contracts");
        
        // Connect to TestToken
        const TestToken = await ethers.getContractFactory("TestToken");
        const testToken = TestToken.attach(contractAddresses.TestToken);
        
        logInfo(`Connected to TestToken: ${contractAddresses.TestToken}`);
        
        logHeader("🧪 Testing Basic Token Functions");
        
        // Test basic functions
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
        
        logHeader("💸 Testing Token Transfer");
        
        // Test transfer
        const transferAmount = ethers.parseEther("1000");
        logInfo(`Transferring ${ethers.formatEther(transferAmount)} ${symbol} to User1...`);
        
        const tx1 = await testToken.transfer(user1.address, transferAmount);
        await tx1.wait();
        
        const user1Balance = await testToken.balanceOf(user1.address);
        const deployerBalanceAfter = await testToken.balanceOf(deployer.address);
        
        logSuccess(`Transfer successful! TX: ${tx1.hash}`);
        logSuccess(`User1 Balance: ${ethers.formatEther(user1Balance)} ${symbol}`);
        logSuccess(`Deployer Balance After: ${ethers.formatEther(deployerBalanceAfter)} ${symbol}`);
        
        logHeader("🔐 Testing Approval & TransferFrom");
        
        // Test approval and transferFrom
        const approveAmount = ethers.parseEther("500");
        logInfo(`User1 approving User2 to spend ${ethers.formatEther(approveAmount)} ${symbol}...`);
        
        const tx2 = await testToken.connect(user1).approve(user2.address, approveAmount);
        await tx2.wait();
        
        const allowance = await testToken.allowance(user1.address, user2.address);
        logSuccess(`Allowance set: ${ethers.formatEther(allowance)} ${symbol}`);
        
        logInfo(`User2 transferring ${ethers.formatEther(approveAmount)} ${symbol} from User1 to Deployer...`);
        const tx3 = await testToken.connect(user2).transferFrom(user1.address, deployer.address, approveAmount);
        await tx3.wait();
        
        const user1BalanceAfter = await testToken.balanceOf(user1.address);
        const deployerBalanceFinal = await testToken.balanceOf(deployer.address);
        
        logSuccess(`TransferFrom successful! TX: ${tx3.hash}`);
        logSuccess(`User1 Balance After: ${ethers.formatEther(user1BalanceAfter)} ${symbol}`);
        logSuccess(`Deployer Balance Final: ${ethers.formatEther(deployerBalanceFinal)} ${symbol}`);
        
        logHeader("🪙 Testing Mint Function");
        
        // Test mint function
        const mintAmount = ethers.parseEther("10000");
        logInfo(`Minting ${ethers.formatEther(mintAmount)} ${symbol} to User2...`);
        
        const tx4 = await testToken.mint(user2.address, mintAmount, "Testing mint function");
        await tx4.wait();
        
        const user2Balance = await testToken.balanceOf(user2.address);
        const totalSupplyAfter = await testToken.totalSupply();
        
        logSuccess(`Mint successful! TX: ${tx4.hash}`);
        logSuccess(`User2 Balance: ${ethers.formatEther(user2Balance)} ${symbol}`);
        logSuccess(`Total Supply After: ${ethers.formatEther(totalSupplyAfter)} ${symbol}`);
        
        logHeader("⏸️ Testing Pause/Unpause");
        
        // Test pause/unpause
        logInfo("Pausing token...");
        const tx5 = await testToken.pause();
        await tx5.wait();
        logSuccess("Token paused successfully!");
        
        try {
            await testToken.transfer(user1.address, ethers.parseEther("100"));
            logError("Transfer should have failed when paused!");
        } catch (error) {
            logSuccess("Transfer correctly failed when paused");
        }
        
        logInfo("Unpausing token...");
        const tx6 = await testToken.unpause();
        await tx6.wait();
        logSuccess("Token unpaused successfully!");
        
        // Test transfer after unpause
        const tx7 = await testToken.transfer(user1.address, ethers.parseEther("100"));
        await tx7.wait();
        logSuccess("Transfer works after unpause!");
        
        logHeader("🔑 Testing Role-Based Access Control");
        
        // Test role-based access control
        const MINTER_ROLE = await testToken.MINTER_ROLE();
        const PAUSER_ROLE = await testToken.PAUSER_ROLE();
        
        const hasMinterRole = await testToken.hasRole(MINTER_ROLE, deployer.address);
        const hasPauserRole = await testToken.hasRole(PAUSER_ROLE, deployer.address);
        
        logSuccess(`Deployer has MINTER_ROLE: ${hasMinterRole}`);
        logSuccess(`Deployer has PAUSER_ROLE: ${hasPauserRole}`);
        
        logHeader("🚫 Testing Blacklist Functionality");
        
        // Test blacklist functionality
        logInfo("Blacklisting User1...");
        const tx8 = await testToken.setBlacklisted(user1.address, true);
        await tx8.wait();
        logSuccess("User1 blacklisted successfully!");
        
        try {
            await testToken.connect(user1).transfer(user2.address, ethers.parseEther("100"));
            logError("Transfer should have failed for blacklisted user!");
        } catch (error) {
            logSuccess("Transfer correctly failed for blacklisted user");
        }
        
        logInfo("Unblacklisting User1...");
        const tx9 = await testToken.setBlacklisted(user1.address, false);
        await tx9.wait();
        logSuccess("User1 unblacklisted successfully!");
        
        // Test transfer after unblacklist
        const tx10 = await testToken.connect(user1).transfer(user2.address, ethers.parseEther("100"));
        await tx10.wait();
        logSuccess("Transfer works after unblacklist!");
        
        logHeader("📊 Final Summary");
        
        const finalBalances = {
            deployer: await testToken.balanceOf(deployer.address),
            user1: await testToken.balanceOf(user1.address),
            user2: await testToken.balanceOf(user2.address)
        };
        
        logInfo("Final Balances:");
        log(`Deployer: ${ethers.formatEther(finalBalances.deployer)} ${symbol}`, 'green');
        log(`User1: ${ethers.formatEther(finalBalances.user1)} ${symbol}`, 'green');
        log(`User2: ${ethers.formatEther(finalBalances.user2)} ${symbol}`, 'green');
        
        logHeader("🔍 BSCScan Links");
        log(`TestToken: https://testnet.bscscan.com/address/${contractAddresses.TestToken}`, 'cyan');
        
        logHeader("✅ All Tests Completed Successfully on BSC Testnet!");
        
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
