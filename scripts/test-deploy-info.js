const hre = require("hardhat");

/**
 * 🧪 Test Deployment Info Display
 */
async function main() {
    console.log("🧪 ===== TESTING DEPLOYMENT INFO DISPLAY =====");
    console.log("📅 Test Time:", new Date().toISOString());

    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("👤 Deployer:", deployer.address);
    
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
        
        // Simulate different balance scenarios
        const testBalances = [
            hre.ethers.parseEther("0.1"),   // 0.1 BNB
            hre.ethers.parseEther("0.05"),  // 0.05 BNB
            hre.ethers.parseEther("0.01"),  // 0.01 BNB
            hre.ethers.parseEther("0.005"), // 0.005 BNB
        ];
        
        for (const balance of testBalances) {
            console.log("\n" + "=".repeat(50));
            console.log("💰 Simulated Balance:", hre.ethers.formatEther(balance), "BNB");
            
            if (estimatedCost > balance) {
                console.log("❌ Insufficient balance for estimated gas cost!");
                console.log("💰 Need:", hre.ethers.formatEther(estimatedCost), "BNB");
                console.log("💰 Have:", hre.ethers.formatEther(balance), "BNB");
                console.log("💰 Shortfall:", hre.ethers.formatEther(estimatedCost - balance), "BNB");
            } else {
                console.log("✅ Sufficient balance for deployment");
                
                // Show deployment summary
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
                console.log("⏰ Countdown: 20 seconds remaining...");
            }
        }
        
    } catch (error) {
        console.log("❌ Error estimating gas:", error.message);
    }
}

main().catch((error) => {
    console.error("❌ Test failed:", error);
    process.exitCode = 1;
});
