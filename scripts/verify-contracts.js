const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🔍 Verifying Test Token Ecosystem Contracts...");
    
    const [deployer] = await hre.ethers.getSigners();
    const network = await hre.ethers.provider.getNetwork();
    const networkName = hre.network.name;
    const chainId = network.chainId.toString();

    console.log(`🌐 Network: ${networkName} (Chain ID: ${chainId})`);

    // Check if deployment file exists
    const deploymentDir = path.join(__dirname, "..", "deployments");
    const deploymentFiles = fs.readdirSync(deploymentDir)
        .filter(file => file.endsWith('.json'))
        .sort()
        .reverse(); // Get most recent first

    if (deploymentFiles.length === 0) {
        console.log("❌ No deployment files found. Please deploy contracts first.");
        return;
    }

    const latestDeployment = path.join(deploymentDir, deploymentFiles[0]);
    const deploymentInfo = JSON.parse(fs.readFileSync(latestDeployment, 'utf8'));

    console.log("📄 Using deployment file:", deploymentFiles[0]);
    console.log("📅 Deployed at:", deploymentInfo.timestamp);

    const contracts = deploymentInfo.contracts;
    const constructorArgs = [];

    try {
        // ===== Verify TestToken ======
        console.log("\n🔍 Verifying TestToken...");
        try {
            await hre.run("verify:verify", {
                address: contracts.TestToken,
                constructorArguments: [deployer.address]
            });
            console.log("✅ TestToken verified successfully");
        } catch (error) {
            if (error.message.includes("Already Verified")) {
                console.log("✅ TestToken already verified");
            } else {
                console.log("❌ TestToken verification failed:", error.message);
            }
        }

        // ===== Verify TestTokenVesting ======
        console.log("\n🔍 Verifying TestTokenVesting...");
        try {
            await hre.run("verify:verify", {
                address: contracts.TestTokenVesting,
                constructorArguments: [contracts.TestToken, deployer.address]
            });
            console.log("✅ TestTokenVesting verified successfully");
        } catch (error) {
            if (error.message.includes("Already Verified")) {
                console.log("✅ TestTokenVesting already verified");
            } else {
                console.log("❌ TestTokenVesting verification failed:", error.message);
            }
        }

        // ===== Verify TestTokenStaking ======
        console.log("\n🔍 Verifying TestTokenStaking...");
        try {
            await hre.run("verify:verify", {
                address: contracts.TestTokenStaking,
                constructorArguments: [contracts.TestToken, deployer.address]
            });
            console.log("✅ TestTokenStaking verified successfully");
        } catch (error) {
            if (error.message.includes("Already Verified")) {
                console.log("✅ TestTokenStaking already verified");
            } else {
                console.log("❌ TestTokenStaking verification failed:", error.message);
            }
        }

        // ===== Verify TestTokenGovernance ======
        console.log("\n🔍 Verifying TestTokenGovernance...");
        try {
            await hre.run("verify:verify", {
                address: contracts.TestTokenGovernance,
                constructorArguments: [contracts.TestToken, deployer.address]
            });
            console.log("✅ TestTokenGovernance verified successfully");
        } catch (error) {
            if (error.message.includes("Already Verified")) {
                console.log("✅ TestTokenGovernance already verified");
            } else {
                console.log("❌ TestTokenGovernance verification failed:", error.message);
            }
        }

        // ===== Verify TestTokenBuybackBurn ======
        console.log("\n🔍 Verifying TestTokenBuybackBurn...");
        try {
            const buybackArgs = [
                contracts.TestToken,
                deploymentInfo.testnetAddresses?.BUSD || deploymentInfo.productionAddresses?.BUSD,
                deploymentInfo.testnetAddresses?.PANCAKE_ROUTER || deploymentInfo.productionAddresses?.PANCAKE_ROUTER,
                deploymentInfo.testnetAddresses?.BNB_USD_ORACLE || deploymentInfo.productionAddresses?.BNB_USD_ORACLE,
                deployer.address
            ];

            await hre.run("verify:verify", {
                address: contracts.TestTokenBuybackBurn,
                constructorArguments: buybackArgs
            });
            console.log("✅ TestTokenBuybackBurn verified successfully");
        } catch (error) {
            if (error.message.includes("Already Verified")) {
                console.log("✅ TestTokenBuybackBurn already verified");
            } else {
                console.log("❌ TestTokenBuybackBurn verification failed:", error.message);
            }
        }

        // ===== Display Verification Summary ======
        console.log("\n📋 Verification Summary:");
        console.log("  TestToken:", contracts.TestToken);
        console.log("  TestTokenVesting:", contracts.TestTokenVesting);
        console.log("  TestTokenStaking:", contracts.TestTokenStaking);
        console.log("  TestTokenGovernance:", contracts.TestTokenGovernance);
        console.log("  TestTokenBuybackBurn:", contracts.TestTokenBuybackBurn);

        console.log("\n✅ Contract verification completed!");
        console.log("🔗 View contracts on block explorer:");
        
        if (chainId === "56") { // BSC Mainnet
            console.log(`  https://bscscan.com/address/${contracts.TestToken}`);
        } else if (chainId === "97") { // BSC Testnet
            console.log(`  https://testnet.bscscan.com/address/${contracts.TestToken}`);
        } else if (chainId === "1") { // Ethereum Mainnet
            console.log(`  https://etherscan.io/address/${contracts.TestToken}`);
        } else if (chainId === "5") { // Ethereum Goerli
            console.log(`  https://goerli.etherscan.io/address/${contracts.TestToken}`);
        }

    } catch (error) {
        console.error("❌ Verification process failed:", error);
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
