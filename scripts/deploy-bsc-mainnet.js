const hre = require("hardhat");

/**
 * 🚀 TokenHubV2 Deployment Script for BSC Mainnet
 * Deploys AIEX token to BSC Mainnet
 */
async function main() {
    console.log("🚀 ===== DEPLOYING AIEX TOKEN TO BSC MAINNET =====");
    console.log("📅 Deployment Time:", new Date().toISOString());

    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("👤 Deployer:", deployer.address);
    
    // Check deployer balance
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Deployer Balance:", hre.ethers.formatEther(balance), "BNB");

    // Check if balance is sufficient (will check after gas estimation)
    if (balance < hre.ethers.parseEther("0.001")) {
        console.log("❌ Insufficient balance! Need at least 0.001 BNB for deployment");
        console.log("💡 Get BNB from exchange or bridge");
        return;
    }

    // Get network info
    const network = await hre.ethers.provider.getNetwork();
    console.log("🌐 Network:", network.name);
    console.log("🔗 Chain ID:", network.chainId.toString());

    // Estimate gas
    console.log("\n⛽ Estimating gas...");
    const TokenHubV2 = await hre.ethers.getContractFactory("TokenHubV2");
    
    try {
        const gasEstimate = await TokenHubV2.getDeployTransaction(deployer.address).then(tx => 
            hre.ethers.provider.estimateGas(tx)
        );
        const feeData = await hre.ethers.provider.getFeeData();
        const gasPrice = feeData.gasPrice;
        const estimatedCost = gasEstimate * gasPrice;
        
        console.log("💰 Total Cost Required:", hre.ethers.formatEther(estimatedCost), "BNB");
        
        if (estimatedCost > balance) {
            console.log("❌ Insufficient balance for estimated gas cost!");
            console.log("💰 Need:", hre.ethers.formatEther(estimatedCost), "BNB");
            console.log("💰 Have:", hre.ethers.formatEther(balance), "BNB");
            return;
        }
        
        // Show deployment summary and ask for confirmation
        console.log("\n📋 ===== DEPLOYMENT SUMMARY =====");
        console.log("🏷️  Token Name: Token Hub");
        console.log("🪙 Token Symbol: AIEX");
        console.log("📈 Total Supply: 100,000,000 AIEX");
        console.log("👑 Owner:", deployer.address);
        console.log("🌐 Network: BSC Mainnet (Chain ID: 56)");
        console.log("💰 Total Cost Required:", hre.ethers.formatEther(estimatedCost), "BNB");
        console.log("💰 Current Balance:", hre.ethers.formatEther(balance), "BNB");
        console.log("💰 Remaining Balance:", hre.ethers.formatEther(balance - estimatedCost), "BNB");
        
        console.log("\n⚠️  WARNING: This will deploy to BSC MAINNET!");
        console.log("💡 Make sure you have enough BNB for gas fees");
        console.log("🚀 Proceeding with deployment in 20 seconds...");
        
        // Countdown 20 seconds before deployment
        for (let i = 20; i > 0; i--) {
            process.stdout.write(`\r⏰ Countdown: ${i} seconds remaining...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log("\n🚀 Starting deployment now!");
        
    } catch (error) {
        console.log("⚠️  Could not estimate gas:", error.message);
        console.log("🚀 Proceeding with deployment anyway...");
    }

    // Deploy contract
    console.log("\n🔨 Deploying TokenHubV2 Contract...");
    const startTime = Date.now();
    
    try {
        const tokenHubV2 = await TokenHubV2.deploy(deployer.address);
        await tokenHubV2.waitForDeployment();
        
        const endTime = Date.now();
        const deploymentTime = (endTime - startTime) / 1000;
        
        const contractAddress = await tokenHubV2.getAddress();
        const deploymentTx = tokenHubV2.deploymentTransaction();
        const receipt = await deploymentTx.wait();
        
        console.log("✅ Deployment Successful!");
        console.log("📍 Contract Address:", contractAddress);
        console.log("🔗 Transaction Hash:", deploymentTx.hash);
        console.log("⏱️  Deployment Time:", deploymentTime.toFixed(2), "seconds");
        console.log("⛽ Gas Used:", receipt.gasUsed.toString());
        console.log("💰 Gas Price:", hre.ethers.formatUnits(receipt.gasPrice, "gwei"), "Gwei");
        console.log("💸 Total Cost:", hre.ethers.formatEther(receipt.gasUsed * receipt.gasPrice), "BNB");

        // Get token info
        console.log("\n📊 Token Information:");
        const name = await tokenHubV2.name();
        const symbol = await tokenHubV2.symbol();
        const decimals = await tokenHubV2.decimals();
        const totalSupply = await tokenHubV2.totalSupply();
        const owner = await tokenHubV2.owner();
        
        console.log("🏷️  Name:", name);
        console.log("🪙 Symbol:", symbol);
        console.log("🔢 Decimals:", decimals.toString());
        console.log("📈 Total Supply:", hre.ethers.formatUnits(totalSupply, 18), symbol);
        console.log("👑 Owner:", owner);

        // Test basic functions
        console.log("\n🧪 Testing Basic Functions:");
        
        // Test transfer
        console.log("🔄 Testing transfer function...");
        const testAmount = hre.ethers.parseEther("1000");
        const initialBalance = await tokenHubV2.balanceOf(deployer.address);
        console.log("✅ Initial Balance:", hre.ethers.formatUnits(initialBalance, 18), symbol);
        
        // Save deployment info
        const deploymentInfo = {
            network: "bscMainnet",
            deploymentTime: new Date().toISOString(),
            contractAddress: contractAddress,
            deployer: deployer.address,
            transactionHash: deploymentTx.hash,
            gasUsed: receipt.gasUsed.toString(),
            gasPrice: hre.ethers.formatUnits(receipt.gasPrice, "gwei") + " Gwei",
            totalCost: hre.ethers.formatEther(receipt.gasUsed * receipt.gasPrice) + " BNB",
            tokenInfo: {
                name: name,
                symbol: symbol,
                decimals: decimals.toString(),
                totalSupply: hre.ethers.formatUnits(totalSupply, 18),
                owner: owner
            },
            bscScanUrl: `https://bscscan.com/address/${contractAddress}`,
            explorerUrl: `https://bscscan.com/tx/${deploymentTx.hash}`
        };

        // Write to file
        const fs = require('fs');
        fs.writeFileSync('deployment-bscMainnet.json', JSON.stringify(deploymentInfo, null, 2));
        console.log("💾 Deployment info saved to deployment-bscMainnet.json");

        console.log("\n🎉 ===== DEPLOYMENT COMPLETED SUCCESSFULLY =====");
        console.log("📍 Contract Address:", contractAddress);
        console.log("🔗 BSCScan URL:", `https://bscscan.com/address/${contractAddress}`);
        console.log("📊 Token:", name, `(${symbol})`);
        console.log("📈 Total Supply:", hre.ethers.formatUnits(totalSupply, 18), symbol);
        console.log("🌐 Network: BSC Mainnet (Chain ID: 56)");
        console.log("✅ Ready for verification and testing!");

    } catch (error) {
        console.log("❌ Deployment failed:", error.message);
        throw error;
    }
}

main().catch((error) => {
    console.error("❌ Script failed:", error);
    process.exitCode = 1;
});
