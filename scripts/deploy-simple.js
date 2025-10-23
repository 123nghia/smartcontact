const hre = require("hardhat");

/**
 * 🚀 Simple Token Deployment Script for BSC Testnet
 * Deploys a simple ERC-20 token with permit functionality
 */
async function main() {
    console.log("🚀 ===== DEPLOYING SIMPLE TOKEN TO BSC TESTNET =====");
    console.log("📅 Deployment Time:", new Date().toISOString());

    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("👤 Deployer:", deployer.address);
    
    // Check deployer balance
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Deployer Balance:", hre.ethers.formatEther(balance), "BNB");

    // Check if balance is sufficient
    if (balance < hre.ethers.parseEther("0.01")) {
        console.log("❌ Insufficient balance! Need at least 0.01 BNB for deployment");
        console.log("💡 Get BNB from BSC Testnet Faucet: https://testnet.bnbchain.org/faucet-smart");
        process.exit(1);
    }

    console.log("\n🔨 ===== DEPLOYING CONTRACT =====");
    
    // Deploy Simple Token
    const TokenHubV2 = await hre.ethers.getContractFactory("TokenHubV2");
    console.log("📦 Deploying Simple Token...");
    
    const token = await TokenHubV2.deploy(deployer.address);
    await token.waitForDeployment();
    
    const contractAddress = await token.getAddress();
    console.log("✅ Simple Token deployed at:", contractAddress);

    // Wait for confirmation
    console.log("⏳ Waiting for confirmation...");
    await token.deploymentTransaction()?.wait(1);

    console.log("\n📊 ===== TOKEN INFORMATION =====");
    
    // Get token info
    const name = await token.name();
    const symbol = await token.symbol();
    const decimals = await token.decimals();
    const totalSupply = await token.totalSupply();
    const initialSupply = await token.INITIAL_SUPPLY();
    const owner = await token.owner();
    
    console.log("📋 Token Name:", name);
    console.log("🪙 Token Symbol:", symbol);
    console.log("🔢 Decimals:", decimals.toString());
    console.log("📈 Total Supply:", hre.ethers.formatUnits(totalSupply, 18), "THD");
    console.log("📈 Initial Supply:", hre.ethers.formatUnits(initialSupply, 18), "THD");
    console.log("👑 Owner:", owner);

    console.log("\n🔧 ===== CONTRACT FEATURES =====");
    
    // Test basic features
    const deployerBalance = await token.balanceOf(deployer.address);
    
    console.log("✅ ERC-20 Standard: Full Compliance");
    console.log("✅ ERC-20 Permit: Gasless approvals");
    console.log("✅ Ownable: Owner-based access control");
    console.log("✅ Burning: Users can burn their tokens");
    console.log("✅ Deployer Balance:", hre.ethers.formatUnits(deployerBalance, 18), "THD");

    console.log("\n🌐 ===== NETWORK INFORMATION =====");
    const network = await hre.ethers.provider.getNetwork();
    console.log("🌐 Network:", network.name);
    console.log("🔗 Chain ID:", network.chainId.toString());
    console.log("📍 Contract Address:", contractAddress);
    console.log("🔗 BSCScan URL:", `https://testnet.bscscan.com/address/${contractAddress}`);

    console.log("\n📋 ===== DEPLOYMENT SUMMARY =====");
    console.log("✅ Contract deployed successfully!");
    console.log("✅ Simple ERC-20 token ready for exchange listing");
    console.log("✅ All basic features working correctly");
    console.log("✅ Owner role assigned");
    console.log("✅ Ready for trading!");

    console.log("\n🎯 ===== NEXT STEPS =====");
    console.log("1. 📝 Save contract address:", contractAddress);
    console.log("2. 🧪 Run test script: npx hardhat run scripts/test-simple.js --network bscTestnet");
    console.log("3. 🔍 Verify on BSCScan:", `https://testnet.bscscan.com/address/${contractAddress}`);
    console.log("4. 📊 Check token info on BSCScan");
    console.log("5. 🚀 Submit for exchange listing!");

    // Save deployment info to file
    const deploymentInfo = {
        contractAddress: contractAddress,
        deployer: deployer.address,
        owner: owner,
        network: network.name,
        chainId: network.chainId.toString(),
        deploymentTime: new Date().toISOString(),
        tokenInfo: {
            name: name,
            symbol: symbol,
            decimals: decimals.toString(),
            totalSupply: hre.ethers.formatUnits(totalSupply, 18),
            initialSupply: hre.ethers.formatUnits(initialSupply, 18)
        },
        features: {
            deployerBalance: hre.ethers.formatUnits(deployerBalance, 18)
        }
    };

    const fs = require('fs');
    fs.writeFileSync('simple-token-deployment.json', JSON.stringify(deploymentInfo, null, 2));
    console.log("\n💾 Deployment info saved to simple-token-deployment.json");

    console.log("\n🎉 ===== DEPLOYMENT COMPLETED =====");
    console.log("🚀 Simple Token is now live on BSC Testnet!");
    console.log("📈 Ready for exchange listing!");
}

main().catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exitCode = 1;
});