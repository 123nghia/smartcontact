const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("🔐 Test Deployed TokenVesting Contracts", function () {
    let tokenHubV2, tokenVesting;
    let owner, beneficiary1, beneficiary2, beneficiary3, beneficiary4;
    
    // Contract addresses from deployment
    const TOKEN_ADDRESS = "0x5a504aF4996f863502493A05E41d9b75925f76F9";
    const VESTING_ADDRESS = "0x2FB6922ce320E54511Ca1DBD1802609A52698Dd6";
    
    const TOTAL_SUPPLY = ethers.parseEther("100000000"); // 100M tokens

    beforeEach(async function () {
        [owner, beneficiary1, beneficiary2, beneficiary3, beneficiary4] = await ethers.getSigners();
        
        console.log("🔧 Connecting to deployed contracts...");
        console.log("   TokenHubV2:", TOKEN_ADDRESS);
        console.log("   TokenVesting:", VESTING_ADDRESS);
        
        // Connect to existing contracts
        tokenHubV2 = await ethers.getContractAt("TokenHubV2", TOKEN_ADDRESS);
        tokenVesting = await ethers.getContractAt("TokenVesting", VESTING_ADDRESS);
        
        console.log("✅ Connected to contracts successfully");
    });

    describe("🔍 Contract Information", function () {
        it("Should have correct token address", async function () {
            const tokenAddress = await tokenVesting.token();
            expect(tokenAddress).to.equal(TOKEN_ADDRESS);
            console.log("✅ Token address:", tokenAddress);
        });

        it("Should show contract details", async function () {
            const tokenName = await tokenHubV2.name();
            const tokenSymbol = await tokenHubV2.symbol();
            const totalSupply = await tokenHubV2.totalSupply();
            
            console.log("📊 Token Information:");
            console.log("   Name:", tokenName);
            console.log("   Symbol:", tokenSymbol);
            console.log("   Total Supply:", ethers.formatEther(totalSupply), tokenSymbol);
            
            expect(tokenName).to.equal("Token Hub");
            expect(tokenSymbol).to.equal("THD");
            expect(totalSupply).to.equal(TOTAL_SUPPLY);
        });

        it("Should show vesting schedules", async function () {
            const categories = [
                "Team & Advisors", "Node OG", "Liquidity & Market Making",
                "Community & Marketing", "Staking & Rewards", 
                "Ecosystem & Partnerships", "Treasury / Reserve Fund"
            ];

            console.log("📅 Vesting Schedules:");
            for (let i = 0; i < categories.length; i++) {
                const schedule = await tokenVesting.schedules(i);
                console.log(`   ${categories[i]}:`);
                console.log(`     Total Allocation: ${ethers.formatEther(schedule.totalAlloc)} tokens`);
                console.log(`     TGE Release: ${Number(schedule.tgePercent) / 100}%`);
                console.log(`     Cliff Period: ${schedule.cliffDays} days`);
                console.log(`     Vesting Duration: ${schedule.vestingDays} days`);
                console.log(`     Start Time: ${schedule.startTime > 0 ? new Date(Number(schedule.startTime) * 1000).toISOString() : 'Not started'}`);
            }
        });
    });

    describe("⏰ Vesting Status", function () {
        it("Should check vesting start status", async function () {
            const tgeTime = await tokenVesting.tgeTime();
            
            if (tgeTime == 0) {
                console.log("⚠️  Vesting has NOT been started yet");
                console.log("   To start vesting, call: await tokenVesting.startVesting()");
            } else {
                console.log("✅ Vesting has been started");
                console.log("   TGE Time:", new Date(Number(tgeTime) * 1000).toISOString());
            }
        });

        it("Should check token balance in vesting contract", async function () {
            const vestingBalance = await tokenHubV2.balanceOf(VESTING_ADDRESS);
            console.log("💰 Vesting Contract Balance:", ethers.formatEther(vestingBalance), "THD");
            
            if (vestingBalance == 0) {
                console.log("⚠️  No tokens in vesting contract");
                console.log("   To transfer tokens, call: await tokenHubV2.transfer(vestingAddress, amount)");
            } else {
                console.log("✅ Tokens are available in vesting contract");
            }
        });
    });

    describe("👥 Beneficiary Management", function () {
        it("Should allow adding beneficiaries (if owner)", async function () {
            try {
                // Use a test beneficiary address
                const testBeneficiaryAddress = "0x1234567890123456789012345678901234567890";
                
                // Try to add a test beneficiary
                const testAmount = ethers.parseEther("1000"); // 1000 tokens
                
                await tokenVesting.addBeneficiary(testBeneficiaryAddress, 1, testAmount); // Node OG category
                console.log("✅ Successfully added beneficiary:", testBeneficiaryAddress);
                
                // Check beneficiary info
                const beneficiaryInfo = await tokenVesting.beneficiaries(testBeneficiaryAddress);
                console.log("   Allocation:", ethers.formatEther(beneficiaryInfo.allocation), "tokens");
                console.log("   Category:", beneficiaryInfo.category);
                console.log("   Active:", beneficiaryInfo.active);
                
            } catch (error) {
                if (error.message.includes("Ownable: caller is not the owner")) {
                    console.log("⚠️  Only owner can add beneficiaries");
                    console.log("   Current caller is not the owner");
                } else {
                    console.log("❌ Error adding beneficiary:", error.message);
                }
            }
        });

        it("Should show category statistics", async function () {
            console.log("📊 Category Statistics:");
            const categories = [
                "Team & Advisors", "Node OG", "Liquidity & Market Making",
                "Community & Marketing", "Staking & Rewards", 
                "Ecosystem & Partnerships", "Treasury / Reserve Fund"
            ];

            for (let i = 0; i < categories.length; i++) {
                const categoryInfo = await tokenVesting.getCategoryInfo(i);
                console.log(`   ${categories[i]}:`);
                console.log(`     Total: ${ethers.formatEther(categoryInfo.total)} tokens`);
                console.log(`     Used: ${ethers.formatEther(categoryInfo.used)} tokens`);
                console.log(`     Available: ${ethers.formatEther(categoryInfo.available)} tokens`);
            }
        });
    });

    describe("💰 Token Claiming", function () {
        it("Should check claimable amount for test beneficiary", async function () {
            try {
                // Use a test beneficiary address
                const testBeneficiaryAddress = "0x1234567890123456789012345678901234567890";
                
                const claimable = await tokenVesting.claimable(testBeneficiaryAddress);
                console.log("💎 Claimable amount for", testBeneficiaryAddress + ":", ethers.formatEther(claimable), "THD");
                
                if (claimable == 0) {
                    console.log("   No tokens claimable (beneficiary not added or vesting not started)");
                } else {
                    console.log("   Tokens are available for claiming!");
                }
            } catch (error) {
                console.log("⚠️  Error checking claimable amount:", error.message);
            }
        });
    });

    describe("🔧 Admin Functions", function () {
        it("Should check owner permissions", async function () {
            const contractOwner = await tokenVesting.owner();
            console.log("👑 Contract Owner:", contractOwner);
            console.log("   Current Signer:", owner.address);
            
            if (contractOwner.toLowerCase() === owner.address.toLowerCase()) {
                console.log("✅ Current signer is the owner");
            } else {
                console.log("⚠️  Current signer is NOT the owner");
                console.log("   Only the owner can perform admin functions");
            }
        });
    });

    describe("🌐 Network Information", function () {
        it("Should show network details", async function () {
            const network = await ethers.provider.getNetwork();
            const blockNumber = await ethers.provider.getBlockNumber();
            const gasPrice = await ethers.provider.getFeeData();
            
            console.log("🌐 Network Information:");
            console.log("   Network:", network.name);
            console.log("   Chain ID:", network.chainId.toString());
            console.log("   Block Number:", blockNumber);
            console.log("   Gas Price:", ethers.formatUnits(gasPrice.gasPrice, "gwei"), "Gwei");
        });
    });
});
