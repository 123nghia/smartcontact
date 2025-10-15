const hre = require("hardhat");
const fs = require("fs");

async function main() {
    // Get network info
    const network = await hre.ethers.provider.getNetwork();
    console.log(`\n🔍 Verifying contract on ${network.name}...\n`);
    
    // Read deployment info
    const filename = `./deployments/${network.name}_${network.chainId}.json`;
    
    if (!fs.existsSync(filename)) {
        throw new Error(`❌ Deployment file not found: ${filename}`);
    }
    
    const deploymentInfo = JSON.parse(fs.readFileSync(filename, "utf8"));
    
    console.log("📍 Contract address:", deploymentInfo.address);
    console.log("👤 Deployer:", deploymentInfo.deployer);
    console.log("🔗 Tx hash:", deploymentInfo.txHash);
    
    // Verify contract
    try {
        console.log("\n⏳ Submitting verification...");
        
        await hre.run("verify:verify", {
            address: deploymentInfo.address,
            constructorArguments: deploymentInfo.constructorArgs,
        });
        
        console.log("\n✅ Contract verified successfully!");
        
        // Update deployment info
        deploymentInfo.verified = true;
        deploymentInfo.verifiedAt = new Date().toISOString();
        fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
        
    } catch (error) {
        if (error.message.includes("Already Verified")) {
            console.log("\n✅ Contract already verified!");
        } else {
            console.error("\n❌ Verification failed:");
            console.error(error.message);
            throw error;
        }
    }
    
    // Display explorer link
    const explorerUrls = {
        "1": "https://etherscan.io",
        "11155111": "https://sepolia.etherscan.io",
        "56": "https://bscscan.com",
        "97": "https://testnet.bscscan.com",
        "137": "https://polygonscan.com",
        "80001": "https://mumbai.polygonscan.com",
    };
    
    const explorerUrl = explorerUrls[network.chainId.toString()];
    if (explorerUrl) {
        console.log(`\n🔗 View on explorer: ${explorerUrl}/address/${deploymentInfo.address}#code\n`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });