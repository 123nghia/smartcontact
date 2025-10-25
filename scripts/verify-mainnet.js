const hre = require("hardhat");

/**
 * 🔍 Verify Contract on BSC Mainnet
 */
async function main() {
    console.log("🔍 ===== VERIFYING CONTRACT ON BSC MAINNET =====");
    console.log("📅 Verification Time:", new Date().toISOString());

    // Contract address to verify
    const contractAddress = "0x1b889A00cB79FB693f79138dBE3eA7bA0E0bb86c";
    console.log("📍 Contract Address:", contractAddress);

    // Check if contract exists
    try {
        const code = await hre.ethers.provider.getCode(contractAddress);
        if (code === "0x") {
            console.log("❌ Contract does not exist at this address");
            console.log("💡 This address might not be deployed or is not a contract");
            return;
        } else {
            console.log("✅ Contract exists at this address");
            console.log("📊 Contract Code Length:", code.length, "characters");
        }
    } catch (error) {
        console.log("❌ Error checking contract:", error.message);
        return;
    }

    // Try to verify the contract
    console.log("\n🔍 Attempting to verify contract...");
    
    try {
        // Try to verify with constructor arguments
        const ownerAddress = "0x4F4e3277b4A78a7CAd1bCBc31e7D0b948C4F87D1"; // Deployer address
        
        console.log("📝 Constructor Arguments:");
        console.log("   - Owner:", ownerAddress);
        
        // Use hardhat verify command
        const { exec } = require('child_process');
        const verifyCommand = `npx hardhat verify --network bscMainnet ${contractAddress} "${ownerAddress}"`;
        
        console.log("🚀 Running verification command...");
        console.log("Command:", verifyCommand);
        
        exec(verifyCommand, (error, stdout, stderr) => {
            if (error) {
                console.log("❌ Verification failed:");
                console.log("Error:", error.message);
                if (stderr) {
                    console.log("Stderr:", stderr);
                }
            } else {
                console.log("✅ Verification successful!");
                console.log("Output:", stdout);
            }
        });
        
    } catch (error) {
        console.log("❌ Error during verification:", error.message);
    }

    // Check contract on BSCScan
    console.log("\n🌐 BSCScan Information:");
    console.log("🔗 Contract URL:", `https://bscscan.com/address/${contractAddress}`);
    console.log("📊 Explorer URL:", `https://bscscan.com/address/${contractAddress}#code`);
    
    // Try to interact with contract if it exists
    try {
        console.log("\n🧪 Testing contract interaction...");
        const TokenHubV2 = await hre.ethers.getContractFactory("TokenHubV2");
        const contract = TokenHubV2.attach(contractAddress);
        
        // Try to call a simple function
        const name = await contract.name();
        console.log("✅ Contract Name:", name);
        
        const symbol = await contract.symbol();
        console.log("✅ Contract Symbol:", symbol);
        
        const decimals = await contract.decimals();
        console.log("✅ Contract Decimals:", decimals.toString());
        
        const totalSupply = await contract.totalSupply();
        console.log("✅ Total Supply:", hre.ethers.formatUnits(totalSupply, 18), symbol);
        
        const owner = await contract.owner();
        console.log("✅ Owner:", owner);
        
        console.log("\n🎉 Contract is working correctly!");
        
    } catch (error) {
        console.log("❌ Error interacting with contract:", error.message);
        console.log("💡 Contract might not be the expected TokenHubV2 contract");
    }
}

main().catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exitCode = 1;
});
