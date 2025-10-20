/**
 * 🔍 BSC Testnet Contract Verification Script
 * Verify tất cả contracts trên BSCScan
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
        logHeader("🔍 BSC Testnet Contract Verification");
        
        // Check if deployment info exists
        const configPath = path.join(__dirname, '../config/contract-addresses.json');
        if (!fs.existsSync(configPath)) {
            logError("Contract addresses file not found!");
            logInfo("Please run deployment script first: npm run deploy:bsc");
            process.exit(1);
        }
        
        const contractAddresses = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        logInfo("Found contract addresses:");
        Object.entries(contractAddresses).forEach(([name, address]) => {
            log(`${name}: ${address}`, 'blue');
        });
        
        logHeader("🔍 Verifying Contracts");
        
        // Verify TestToken
        logInfo("Verifying TestToken...");
        try {
            await hre.run("verify:verify", {
                address: contractAddresses.TestToken,
                constructorArguments: [process.env.DEPLOYER_ADDRESS || "0x0000000000000000000000000000000000000000"],
                contract: "contracts/TestToken.sol:TestToken"
            });
            logSuccess("TestToken verified successfully!");
        } catch (error) {
            if (error.message.includes("Already Verified")) {
                logSuccess("TestToken already verified!");
            } else {
                logError(`TestToken verification failed: ${error.message}`);
            }
        }
        
        // Verify TestTokenVesting
        logInfo("Verifying TestTokenVesting...");
        try {
            await hre.run("verify:verify", {
                address: contractAddresses.TestTokenVesting,
                constructorArguments: [
                    contractAddresses.TestToken,
                    process.env.DEPLOYER_ADDRESS || "0x0000000000000000000000000000000000000000"
                ],
                contract: "contracts/TestTokenVesting.sol:TestTokenVesting"
            });
            logSuccess("TestTokenVesting verified successfully!");
        } catch (error) {
            if (error.message.includes("Already Verified")) {
                logSuccess("TestTokenVesting already verified!");
            } else {
                logError(`TestTokenVesting verification failed: ${error.message}`);
            }
        }
        
        // Verify TestTokenStaking
        logInfo("Verifying TestTokenStaking...");
        try {
            await hre.run("verify:verify", {
                address: contractAddresses.TestTokenStaking,
                constructorArguments: [
                    contractAddresses.TestToken,
                    process.env.DEPLOYER_ADDRESS || "0x0000000000000000000000000000000000000000"
                ],
                contract: "contracts/TestTokenStaking.sol:TestTokenStaking"
            });
            logSuccess("TestTokenStaking verified successfully!");
        } catch (error) {
            if (error.message.includes("Already Verified")) {
                logSuccess("TestTokenStaking already verified!");
            } else {
                logError(`TestTokenStaking verification failed: ${error.message}`);
            }
        }
        
        // Verify TestTokenGovernance
        logInfo("Verifying TestTokenGovernance...");
        try {
            await hre.run("verify:verify", {
                address: contractAddresses.TestTokenGovernance,
                constructorArguments: [
                    contractAddresses.TestToken,
                    process.env.DEPLOYER_ADDRESS || "0x0000000000000000000000000000000000000000"
                ],
                contract: "contracts/TestTokenGovernance.sol:TestTokenGovernance"
            });
            logSuccess("TestTokenGovernance verified successfully!");
        } catch (error) {
            if (error.message.includes("Already Verified")) {
                logSuccess("TestTokenGovernance already verified!");
            } else {
                logError(`TestTokenGovernance verification failed: ${error.message}`);
            }
        }
        
        // Verify TestTokenBuybackBurn
        logInfo("Verifying TestTokenBuybackBurn...");
        try {
            await hre.run("verify:verify", {
                address: contractAddresses.TestTokenBuybackBurn,
                constructorArguments: [
                    contractAddresses.TestToken,
                    "0x0000000000000000000000000000000000000001", // mockStablecoin
                    "0x0000000000000000000000000000000000000002", // mockRouter
                    "0x0000000000000000000000000000000000000003", // mockOracle
                    process.env.DEPLOYER_ADDRESS || "0x0000000000000000000000000000000000000000"
                ],
                contract: "contracts/TestTokenBuybackBurn.sol:TestTokenBuybackBurn"
            });
            logSuccess("TestTokenBuybackBurn verified successfully!");
        } catch (error) {
            if (error.message.includes("Already Verified")) {
                logSuccess("TestTokenBuybackBurn already verified!");
            } else {
                logError(`TestTokenBuybackBurn verification failed: ${error.message}`);
            }
        }
        
        logHeader("🔍 BSCScan Links");
        Object.entries(contractAddresses).forEach(([name, address]) => {
            log(`${name}: https://testnet.bscscan.com/address/${address}`, 'cyan');
        });
        
        logHeader("✅ Contract Verification Completed!");
        
    } catch (error) {
        logError(`Verification failed: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}

// Run the verification
main()
    .then(() => process.exit(0))
    .catch((error) => {
        logError(`Script failed: ${error.message}`);
        console.error(error);
        process.exit(1);
    });
