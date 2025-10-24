const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("🚀 ====== TOKEN VESTING DEPLOYMENT ======");
    console.log("📅 Deployment Time:", new Date().toISOString());
    console.log("🌐 Network:", hre.network.name);
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("\n👤 Deployer Information:");
    console.log("   Address:", deployer.address);
    console.log("   Balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "BNB");

    // TokenHubV2 contract address
    let TOKEN_ADDRESS = "0x5a504aF4996f863502493A05E41d9b75925f76F9";
    
    // If no token address provided, try to deploy TokenHubV2 first
    // if (!TOKEN_ADDRESS || TOKEN_ADDRESS === "0x5a504aF4996f863502493A05E41d9b75925f76F9") {
    //     console.log("\n🔨 No token address provided. Deploying TokenHubV2 first...");
    //     try {
    //         const TokenHubV2 = await ethers.getContractFactory("TokenHubV2");
    //         const tokenHubV2 = await TokenHubV2.deploy(deployer.address);
    //         await tokenHubV2.waitForDeployment();
    //         TOKEN_ADDRESS = await tokenHubV2.getAddress();
    //         console.log("✅ TokenHubV2 deployed to:", TOKEN_ADDRESS);
    //     } catch (error) {
    //         console.log("❌ Failed to deploy TokenHubV2:", error.message);
    //         console.log("💡 Please deploy TokenHubV2 first or set TOKEN_ADDRESS environment variable");
    //         console.log("   Example: TOKEN_ADDRESS=0x1234... npx hardhat run scripts/deploy-vesting.js --network bsc");
    //         return;
    //     }
    // }

    console.log("\n🔗 Token Information:");
    console.log("   Address:", TOKEN_ADDRESS);
    
    // Verify token contract
    try {
        const token = await ethers.getContractAt("IERC20", TOKEN_ADDRESS);
        const tokenName = await token.name();
        const tokenSymbol = await token.symbol();
        const totalSupply = await token.totalSupply();
        console.log("   Name:", tokenName);
        console.log("   Symbol:", tokenSymbol);
        console.log("   Total Supply:", ethers.formatEther(totalSupply), tokenSymbol);
    } catch (error) {
        console.log("⚠️  Warning: Could not verify token contract details");
    }

    // Deploy TokenVesting contract
    console.log("\n📦 Deploying TokenVesting contract...");
    const TokenVesting = await ethers.getContractFactory("TokenVesting");
    
    // Estimate gas
    const gasEstimate = await deployer.estimateGas(
        TokenVesting.getDeployTransaction(TOKEN_ADDRESS)
    );
    const gasPrice = await deployer.provider.getFeeData().then(fee => fee.gasPrice);
    const estimatedCost = gasEstimate * gasPrice;
    
    console.log("⛽ Gas Estimation:");
    console.log("   Estimated Gas:", gasEstimate.toString());
    console.log("   Gas Price:", ethers.formatUnits(gasPrice, "gwei"), "Gwei");
    console.log("   Estimated Cost:", ethers.formatEther(estimatedCost), "BNB");
    
    const tokenVesting = await TokenVesting.deploy(TOKEN_ADDRESS);
    await tokenVesting.waitForDeployment();
    
    console.log("✅ TokenVesting deployed successfully!");
    console.log("   Contract Address:", await tokenVesting.getAddress());
    console.log("   Transaction Hash:", tokenVesting.deploymentTransaction().hash);
    console.log("   Gas Used:", tokenVesting.deploymentTransaction().gasLimit?.toString() || "N/A");

    // Verify deployment and get vesting schedule info
    console.log("\n📅 Vesting Schedule Configuration:");
    const categories = [
        "Team & Advisors",
        "Node OG", 
        "Liquidity & Market Making",
        "Community & Marketing",
        "Staking & Rewards",
        "Ecosystem & Partnerships",
        "Treasury / Reserve Fund"
    ];

    const percentages = [7, 3, 15, 20, 10, 25, 20];
    const tgeReleases = [0, 10, 40, 20, 0, 10, 20];
    const cliffDays = [180, 0, 0, 0, 0, 0, 0];
    const vestingDays = [1080, 720, 360, 720, 1080, 900, 1440];

    console.log("┌─────────────────────────────────┬─────────┬──────────┬──────────┬─────────────┬─────────┐");
    console.log("│ Category                        │ Percent │ TGE (%)  │ Cliff    │ Vesting     │ Active  │");
    console.log("├─────────────────────────────────┼─────────┼──────────┼──────────┼─────────────┼─────────┤");

    for (let i = 0; i < categories.length; i++) {
        try {
            const schedule = await tokenVesting.schedules(i);
            const cliffText = cliffDays[i] > 0 ? `${cliffDays[i]}d` : "None";
            const vestingText = `${vestingDays[i]}d`;
            const activeText = "✅";
            
            console.log(`│ ${categories[i].padEnd(31)} │ ${percentages[i].toString().padStart(7)}% │ ${tgeReleases[i].toString().padStart(8)}% │ ${cliffText.padStart(8)} │ ${vestingText.padStart(11)} │ ${activeText.padStart(7)} │`);
        } catch (error) {
            const cliffText = cliffDays[i] > 0 ? `${cliffDays[i]}d` : "None";
            const vestingText = `${vestingDays[i]}d`;
            console.log(`│ ${categories[i].padEnd(31)} │ ${percentages[i].toString().padStart(7)}% │ ${tgeReleases[i].toString().padStart(8)}% │ ${cliffText.padStart(8)} │ ${vestingText.padStart(11)} │ ✅ │`);
        }
    }
    console.log("└─────────────────────────────────┴─────────┴──────────┴──────────┴─────────────┴─────────┘");

    // Save deployment info
    const deploymentInfo = {
        network: hre.network.name,
        deploymentTime: new Date().toISOString(),
        tokenVesting: {
            address: await tokenVesting.getAddress(),
            deployer: deployer.address,
            tokenAddress: TOKEN_ADDRESS,
            transactionHash: tokenVesting.deploymentTransaction().hash,
            gasUsed: tokenVesting.deploymentTransaction().gasLimit?.toString() || "N/A",
            gasPrice: ethers.formatUnits(gasPrice, "gwei") + " Gwei"
        },
        vestingSchedules: {}
    };

    // Add vesting schedule details
    for (let i = 0; i < categories.length; i++) {
        try {
            const schedule = await tokenVesting.schedules(i);
            deploymentInfo.vestingSchedules[categories[i]] = {
                totalAllocation: ethers.formatEther(schedule.totalAlloc),
                tgeRelease: (Number(schedule.tgePercent) / 100).toFixed(1) + "%",
                cliffPeriod: cliffDays[i] + " days",
                vestingDuration: vestingDays[i] + " days",
                isActive: true
            };
        } catch (error) {
            deploymentInfo.vestingSchedules[categories[i]] = {
                totalAllocation: (percentages[i] * 1000000).toString() + " tokens",
                tgeRelease: tgeReleases[i] + "%",
                cliffPeriod: cliffDays[i] + " days",
                vestingDuration: vestingDays[i] + " days",
                isActive: true
            };
        }
    }
    
    const deploymentFile = path.join(__dirname, `../deployment-${hre.network.name}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log("\n💾 Deployment info saved to:", deploymentFile);

    console.log("\n🎉 ====== DEPLOYMENT COMPLETED SUCCESSFULLY! ======");
    console.log("\n📋 Next Steps:");
    console.log("   1. 🔄 Transfer tokens to TokenVesting contract");
    console.log("   2. ⏰ Call startVesting() to begin vesting process");
    console.log("   3. 👥 Add beneficiaries using addBeneficiary() or batchAdd()");
    console.log("   4. 💰 Beneficiaries can claim tokens using claim()");
    
    console.log("\n🔧 Useful Commands:");
    console.log(`   📝 Verify contract: npx hardhat verify --network ${hre.network.name} ${await tokenVesting.getAddress()} "${TOKEN_ADDRESS}"`);
    console.log(`   🧪 Run tests: npx hardhat test test/vesting-test.js`);
    console.log(`   📊 Check deployment: cat ${deploymentFile}`);
    
    console.log("\n💡 Example Usage:");
    console.log("   // Start vesting");
    console.log("   await tokenVesting.startVesting();");
    console.log("   ");
    console.log("   // Add beneficiary");
    console.log("   await tokenVesting.addBeneficiary(beneficiaryAddress, 0, ethers.parseEther('1000000'));");
    console.log("   ");
    console.log("   // Check claimable amount");
    console.log("   const claimable = await tokenVesting.claimable(beneficiaryAddress);");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
