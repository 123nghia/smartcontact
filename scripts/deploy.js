const hre = require("hardhat");

async function main() {
    console.log("\n🚀 Starting TestToken Deployment...\n");
    
    // Get deployer
    const [deployer] = await hre.ethers.getSigners();
    console.log("📍 Deploying from:", deployer.address);
    
    // Check balance
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Deployer balance:", hre.ethers.formatEther(balance), "ETH");
    
    // Get network info
    const network = await hre.ethers.provider.getNetwork();
    console.log("🌐 Network:", network.name, `(Chain ID: ${network.chainId})`);
    
    // Check minimum balance (adjust as needed)
    const minBalance = hre.ethers.parseEther("0.01"); // 0.01 ETH minimum
    if (balance < minBalance) {
        throw new Error(`❌ Insufficient balance. Need at least ${hre.ethers.formatEther(minBalance)} ETH`);
    }
    
    console.log("\n⏳ Deploying TestToken...");
    
    // Deploy contract
    const Token = await hre.ethers.getContractFactory("TestToken");
    const token = await Token.deploy(deployer.address);
    
    // Wait for deployment
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    
    console.log("✅ TestToken deployed at:", tokenAddress);
    
    // Wait for a few blocks before verification (recommended for better reliability)
    if (network.chainId !== 31337n) { // Skip if local network
        console.log("\n⏳ Waiting for block confirmations...");
        await token.deploymentTransaction().wait(5); // Wait 5 blocks
        console.log("✅ Confirmations complete");
    }
    
    // Display token info
    console.log("\n📊 Token Information:");
    const info = await token.getTokenInfo();
    console.log("   Name:", info.tokenName);
    console.log("   Symbol:", info.tokenSymbol);
    console.log("   Decimals:", info.tokenDecimals.toString());
    console.log("   Cap:", hre.ethers.formatUnits(info.tokenCap, 18), "tokens");
    console.log("   Total Supply:", hre.ethers.formatUnits(info.tokenTotalSupply, 18), "tokens");
    
    // Display roles
    console.log("\n👤 Role Assignments:");
    const DEFAULT_ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
    const MINTER_ROLE = await token.MINTER_ROLE();
    const PAUSER_ROLE = await token.PAUSER_ROLE();
    const BLACKLISTER_ROLE = await token.BLACKLISTER_ROLE();
    
    console.log("   Admin:", await token.hasRole(DEFAULT_ADMIN_ROLE, deployer.address) ? "✓" : "✗");
    console.log("   Minter:", await token.hasRole(MINTER_ROLE, deployer.address) ? "✓" : "✗");
    console.log("   Pauser:", await token.hasRole(PAUSER_ROLE, deployer.address) ? "✓" : "✗");
    console.log("   Blacklister:", await token.hasRole(BLACKLISTER_ROLE, deployer.address) ? "✓" : "✗");
    
    // Save deployment info to file
    const fs = require("fs");
    const deploymentInfo = {
        network: network.name,
        chainId: network.chainId.toString(),
        contract: "TestToken",
        address: tokenAddress,
        deployer: deployer.address,
        deployedAt: new Date().toISOString(),
        blockNumber: await hre.ethers.provider.getBlockNumber(),
        txHash: token.deploymentTransaction().hash,
        constructorArgs: [deployer.address]
    };
    
    const deploymentsDir = "./deployments";
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir);
    }
    
    const filename = `${deploymentsDir}/${network.name}_${network.chainId}.json`;
    fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
    console.log("\n💾 Deployment info saved to:", filename);
    
    // Verification instructions
    if (network.chainId !== 31337n && network.chainId !== 1337n) {
        console.log("\n📝 To verify contract on block explorer, run:");
        console.log(`   npx hardhat verify --network ${network.name} ${tokenAddress} "${deployer.address}"`);
    }
    
    console.log("\n✨ Deployment completed successfully!\n");
    
    return {
        token: tokenAddress,
        deployer: deployer.address,
        network: network.name,
        chainId: network.chainId.toString()
    };
}

// Execute deployment
main()
    .then((result) => {
        console.log("🎉 Deployment result:", result);
        process.exitCode = 0;
    })
    .catch((error) => {
        console.error("\n❌ Deployment failed:");
        console.error(error);
        process.exitCode = 1;
    });