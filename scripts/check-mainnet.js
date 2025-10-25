const hre = require("hardhat");

/**
 * 🔍 Check BSC Mainnet Status
 */
async function main() {
    console.log("🔍 ===== CHECKING BSC MAINNET STATUS =====");
    console.log("📅 Check Time:", new Date().toISOString());

    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("👤 Deployer:", deployer.address);
    
    // Check deployer balance
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Deployer Balance:", hre.ethers.formatEther(balance), "BNB");

    // Get network info
    const network = await hre.ethers.provider.getNetwork();
    console.log("🌐 Network:", network.name);
    console.log("🔗 Chain ID:", network.chainId.toString());

    // Check if we're on BSC Mainnet
    if (Number(network.chainId) === 56) {
        console.log("✅ Connected to BSC Mainnet");
    } else {
        console.log("❌ Not connected to BSC Mainnet (Chain ID should be 56)");
    }

    // Check gas price
    try {
        const feeData = await hre.ethers.provider.getFeeData();
        console.log("⛽ Gas Price:", hre.ethers.formatUnits(feeData.gasPrice, "gwei"), "Gwei");
    } catch (error) {
        console.log("❌ Could not get gas price:", error.message);
    }

    // Check if balance is sufficient
    const minBalance = hre.ethers.parseEther("0.1");
    if (balance >= minBalance) {
        console.log("✅ Sufficient balance for deployment");
    } else {
        console.log("❌ Insufficient balance for deployment");
        console.log("💡 Need at least 0.1 BNB for mainnet deployment");
    }

    // Try to check a known contract
    try {
        const knownContract = "0x55d398326f99059fF775485246999027B3197955"; // USDT on BSC
        const code = await hre.ethers.provider.getCode(knownContract);
        if (code !== "0x") {
            console.log("✅ Network is working (can read contract code)");
        } else {
            console.log("❌ Network issue (cannot read contract code)");
        }
    } catch (error) {
        console.log("❌ Network error:", error.message);
    }
}

main().catch((error) => {
    console.error("❌ Check failed:", error);
    process.exitCode = 1;
});
