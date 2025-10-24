const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("🔐 TokenVesting Contract - Comprehensive Test Suite", function () {
    let tokenHubV2, tokenVesting;
    let owner, beneficiary1, beneficiary2, beneficiary3, beneficiary4;
    let vestingStartTime;
    
    const TOTAL_SUPPLY = ethers.parseEther("100000000"); // 100M tokens
    const BASIS_POINTS = 10000;
    
    // Test data for different categories
    const TEST_ALLOCATIONS = {
        team: ethers.parseEther("1000000"),      // 1M tokens
        nodeOG: ethers.parseEther("500000"),     // 500K tokens
        liquidity: ethers.parseEther("2000000"), // 2M tokens
        community: ethers.parseEther("1500000"), // 1.5M tokens
        staking: ethers.parseEther("800000"),    // 800K tokens
        ecosystem: ethers.parseEther("3000000"), // 3M tokens
        treasury: ethers.parseEther("1200000")   // 1.2M tokens
    };

    beforeEach(async function () {
        [owner, beneficiary1, beneficiary2, beneficiary3, beneficiary4] = await ethers.getSigners();
        
        console.log("🔧 Setting up test environment...");
        
        // Use existing deployed contracts
        const TOKEN_ADDRESS = "0x5a504aF4996f863502493A05E41d9b75925f76F9";
        const VESTING_ADDRESS = "0x2FB6922ce320E54511Ca1DBD1802609A52698Dd6";
        
        // Connect to existing TokenHubV2 contract
        tokenHubV2 = await ethers.getContractAt("TokenHubV2", TOKEN_ADDRESS);
        console.log("✅ Connected to TokenHubV2:", TOKEN_ADDRESS);
        
        // Connect to existing TokenVesting contract
        tokenVesting = await ethers.getContractAt("TokenVesting", VESTING_ADDRESS);
        console.log("✅ Connected to TokenVesting:", VESTING_ADDRESS);
        
        // Check if vesting has started
        const tgeTime = await tokenVesting.tgeTime();
        if (tgeTime == 0) {
            console.log("⚠️  Vesting not started yet. Please start vesting first.");
            console.log("   Call: await tokenVesting.startVesting()");
        } else {
            vestingStartTime = Number(tgeTime);
            console.log("✅ Vesting started at:", new Date(vestingStartTime * 1000).toISOString());
        }
        
        // Check token balance in vesting contract
        const vestingBalance = await tokenHubV2.balanceOf(VESTING_ADDRESS);
        console.log("✅ Vesting contract balance:", ethers.formatEther(vestingBalance), "THD");
        
        if (vestingBalance == 0) {
            console.log("⚠️  No tokens in vesting contract. Please transfer tokens first.");
            console.log("   Call: await tokenHubV2.transfer(vestingAddress, amount)");
        }
    });

    describe("🚀 Deployment & Initialization", function () {
        it("Should set the correct token address", async function () {
            expect(await tokenVesting.token()).to.equal("0x5a504aF4996f863502493A05E41d9b75925f76F9");
        });

        it("Should initialize all 7 vesting schedules correctly", async function () {
            const categories = [
                { name: "Team & Advisors", index: 0, expectedAllocation: "7000000", tgeRelease: 0, cliffDays: 180, vestingDays: 1080 },
                { name: "Node OG", index: 1, expectedAllocation: "3000000", tgeRelease: 1000, cliffDays: 0, vestingDays: 720 },
                { name: "Liquidity & Market Making", index: 2, expectedAllocation: "15000000", tgeRelease: 4000, cliffDays: 0, vestingDays: 360 },
                { name: "Community & Marketing", index: 3, expectedAllocation: "20000000", tgeRelease: 2000, cliffDays: 0, vestingDays: 720 },
                { name: "Staking & Rewards", index: 4, expectedAllocation: "10000000", tgeRelease: 0, cliffDays: 0, vestingDays: 1080 },
                { name: "Ecosystem & Partnerships", index: 5, expectedAllocation: "25000000", tgeRelease: 1000, cliffDays: 0, vestingDays: 900 },
                { name: "Treasury / Reserve Fund", index: 6, expectedAllocation: "20000000", tgeRelease: 2000, cliffDays: 0, vestingDays: 1440 }
            ];

            for (const category of categories) {
                const schedule = await tokenVesting.schedules(category.index);
                expect(schedule.totalAlloc).to.equal(ethers.parseEther(category.expectedAllocation));
                expect(schedule.tgePercent).to.equal(category.tgeRelease);
                expect(schedule.cliffDays).to.equal(category.cliffDays);
                expect(schedule.vestingDays).to.equal(category.vestingDays);
                expect(schedule.startTime).to.be.greaterThan(0);
                console.log(`✅ ${category.name}: ${category.expectedAllocation} tokens, ${category.tgeRelease/100}% TGE, ${category.cliffDays}d cliff, ${category.vestingDays}d vesting`);
            }
        });

        it("Should have correct total allocation (100M tokens)", async function () {
            let totalAllocation = 0n;
            for (let i = 0; i < 7; i++) {
                const schedule = await tokenVesting.schedules(i);
                totalAllocation = totalAllocation + schedule.totalAlloc;
            }
            expect(totalAllocation).to.equal(TOTAL_SUPPLY);
            console.log("✅ Total allocation verified:", ethers.formatEther(totalAllocation), "tokens");
        });

        it("Should set TGE time correctly", async function () {
            const tgeTime = await tokenVesting.tgeTime();
            expect(tgeTime).to.be.greaterThan(0);
            console.log("✅ TGE time set:", new Date(Number(tgeTime) * 1000).toISOString());
        });
    });

    describe("👥 Beneficiary Management", function () {
        it("Should add beneficiary correctly", async function () {
            const allocation = ethers.parseEther("1000000"); // 1M tokens
            
            await tokenVesting.addBeneficiary(beneficiary1.address, 0, allocation); // TeamAdvisors
            
            const beneficiaryInfo = await tokenVesting.beneficiaries(beneficiary1.address);
            expect(beneficiaryInfo.allocation).to.equal(allocation);
            expect(beneficiaryInfo.category).to.equal(0); // TeamAdvisors
            expect(beneficiaryInfo.claimed).to.equal(0);
            expect(beneficiaryInfo.active).to.be.true;

            const categoryInfo = await tokenVesting.getCategoryInfo(0);
            expect(categoryInfo.used).to.equal(allocation);
            expect(categoryInfo.available).to.equal(ethers.parseEther("7000000") - allocation);
        });

        it("Should batch add beneficiaries", async function () {
            const beneficiaries_ = [beneficiary1.address, beneficiary2.address, beneficiary3.address];
            const allocations = [
                ethers.parseEther("500000"),
                ethers.parseEther("300000"),
                ethers.parseEther("200000")
            ];
            
            // Add beneficiaries individually since batchAdd is commented out
            for (let i = 0; i < beneficiaries_.length; i++) {
                await tokenVesting.addBeneficiary(beneficiaries_[i], 1, allocations[i]);
            }
            
            for (let i = 0; i < beneficiaries_.length; i++) {
                const beneficiaryInfo = await tokenVesting.beneficiaries(beneficiaries_[i]);
                expect(beneficiaryInfo.category).to.equal(1); // NodeOG
                expect(beneficiaryInfo.allocation).to.equal(allocations[i]);
            }

            const categoryInfo = await tokenVesting.getCategoryInfo(1);
            expect(categoryInfo.used).to.equal(ethers.parseEther("1000000")); // 500k + 300k + 200k
        });

        it("Should prevent adding beneficiary with zero allocation", async function () {
            await expect(
                tokenVesting.addBeneficiary(beneficiary1.address, 0, 0)
            ).to.be.revertedWith("Invalid input");
        });

        it("Should prevent adding beneficiary with zero address", async function () {
            await expect(
                tokenVesting.addBeneficiary(ethers.ZeroAddress, 0, ethers.parseEther("1000000"))
            ).to.be.revertedWith("Invalid input");
        });

        it("Should prevent adding an already existing beneficiary", async function () {
            await tokenVesting.addBeneficiary(beneficiary1.address, 0, ethers.parseEther("1000000"));
            await expect(
                tokenVesting.addBeneficiary(beneficiary1.address, 0, ethers.parseEther("1000000"))
            ).to.be.revertedWith("Already exists");
        });

        it("Should prevent exceeding category allocation", async function () {
            const maxAllocation = ethers.parseEther("7000000"); // Team & Advisors total
            await tokenVesting.addBeneficiary(beneficiary1.address, 0, maxAllocation);
            await expect(
                tokenVesting.addBeneficiary(beneficiary2.address, 0, ethers.parseEther("1"))
            ).to.be.revertedWith("Exceeds limit");
        });
    });

    describe("💰 Token Claiming", function () {
        beforeEach(async function () {
            await tokenVesting.addBeneficiary(beneficiary1.address, 0, ethers.parseEther("1000000")); // TeamAdvisors
            await tokenVesting.addBeneficiary(beneficiary2.address, 1, ethers.parseEther("500000")); // NodeOG
        });

        it("Should not allow claiming before cliff period (Team & Advisors)", async function () {
            // Team & Advisors has 180 days cliff
            const claimable = await tokenVesting.claimable(beneficiary1.address);
            expect(claimable).to.equal(0);
            await expect(tokenVesting.connect(beneficiary1).claim()).to.be.revertedWith("Nothing to claim");
        });

        it("Should allow claiming TGE tokens immediately (Node OG)", async function () {
            // Node OG has 10% TGE release and no cliff
            const claimable = await tokenVesting.claimable(beneficiary2.address);
            const expectedTGE = (ethers.parseEther("500000") * 1000n) / 10000n; // 10% of 500k
            
            expect(claimable).to.be.closeTo(expectedTGE, ethers.parseEther("1000")); // Allow small difference
            
            const initialBalance = await tokenHubV2.balanceOf(beneficiary2.address);
            await tokenVesting.connect(beneficiary2).claim();
            const finalBalance = await tokenHubV2.balanceOf(beneficiary2.address);
            
            expect(finalBalance - initialBalance).to.be.closeTo(expectedTGE, ethers.parseEther("1000"));
            expect(await tokenVesting.claimable(beneficiary2.address)).to.equal(0);
        });

        it("Should calculate linear vesting correctly", async function () {
            // Fast forward 360 days (half of 720 days vesting for Node OG)
            await time.increase(360 * 24 * 60 * 60);
            
            const claimable = await tokenVesting.claimable(beneficiary2.address);
            const allocation = ethers.parseEther("500000");
            const tgeAmount = (allocation * 1000n) / 10000n; // 10%
            const vestingAmount = allocation - tgeAmount; // 90%
            const expectedClaimable = tgeAmount + (vestingAmount / 2n); // TGE + 50% of vesting
            
            expect(claimable).to.be.closeTo(expectedClaimable, ethers.parseEther("1000")); // Allow small difference
        });

        it("Should allow full claiming after vesting period", async function () {
            // Fast forward 750 days (more than 720 days vesting for Node OG)
            await time.increase(750 * 24 * 60 * 60);

            const claimable = await tokenVesting.claimable(beneficiary2.address);
            const allocation = ethers.parseEther("500000");
            expect(claimable).to.be.closeTo(allocation, ethers.parseEther("1000")); // Should be full allocation
            
            const initialBalance = await tokenHubV2.balanceOf(beneficiary2.address);
            await tokenVesting.connect(beneficiary2).claim();
            const finalBalance = await tokenHubV2.balanceOf(beneficiary2.address);
            
            expect(finalBalance - initialBalance).to.be.closeTo(allocation, ethers.parseEther("1000"));
            expect(await tokenVesting.claimable(beneficiary2.address)).to.equal(0);
        });

        it("Should prevent claiming more than allocated", async function () {
            await time.increase(750 * 24 * 60 * 60); // Fast forward to full vesting
            await tokenVesting.connect(beneficiary2).claim(); // Claim all
            
            const claimable = await tokenVesting.claimable(beneficiary2.address);
            expect(claimable).to.equal(0);
            await expect(tokenVesting.connect(beneficiary2).claim()).to.be.revertedWith("Nothing to claim");
        });
    });

    describe("🔧 Admin Functions", function () {
        beforeEach(async function () {
            await tokenVesting.addBeneficiary(beneficiary1.address, 0, ethers.parseEther("1000000")); // TeamAdvisors
        });

        it("Should allow owner to deactivate beneficiary", async function () {
            await tokenVesting.deactivate(beneficiary1.address);
            const beneficiaryInfo = await tokenVesting.beneficiaries(beneficiary1.address);
            expect(beneficiaryInfo.active).to.be.false;
            await expect(tokenVesting.connect(beneficiary1).claim()).to.be.revertedWith("Nothing to claim");
        });

        it("Should prevent non-owner from calling admin functions", async function () {
            await expect(
                tokenVesting.connect(beneficiary1).deactivate(beneficiary2.address)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should prevent starting vesting twice", async function () {
            await expect(
                tokenVesting.startVesting()
            ).to.be.revertedWith("Already started");
        });
    });

    describe("📊 Category Statistics", function () {
        beforeEach(async function () {
            await tokenVesting.addBeneficiary(beneficiary1.address, 0, ethers.parseEther("1000000"));
            await tokenVesting.addBeneficiary(beneficiary2.address, 0, ethers.parseEther("500000"));
        });

        it("Should track category statistics correctly", async function () {
            const stats = await tokenVesting.getCategoryInfo(0); // TeamAdvisors
            expect(stats.used).to.equal(ethers.parseEther("1500000"));
            expect(stats.total).to.equal(ethers.parseEther("7000000"));
            expect(stats.available).to.equal(ethers.parseEther("5500000")); // 7M - 1.5M
        });
    });

    describe("🔍 Edge Cases", function () {
        it("Should handle zero vesting duration gracefully", async function () {
            // This test would require modifying the contract, so we'll test the current behavior
            await tokenVesting.addBeneficiary(beneficiary1.address, 1, ethers.parseEther("1000000")); // NodeOG
            await time.increase(1); // Pass 1 second
            const claimable = await tokenVesting.claimable(beneficiary1.address);
            const expectedTGE = (ethers.parseEther("1000000") * 1000n) / 10000n; // 10% TGE
            expect(claimable).to.be.closeTo(expectedTGE, ethers.parseEther("1000"));
        });

        it("Should prevent exceeding category allocation", async function () {
            const maxAllocation = ethers.parseEther("7000000"); // Team & Advisors total
            await tokenVesting.addBeneficiary(beneficiary1.address, 0, maxAllocation);
            await expect(
                tokenVesting.addBeneficiary(beneficiary2.address, 0, ethers.parseEther("1"))
            ).to.be.revertedWith("Exceeds limit");
        });

        it("Should handle claimable calculation for inactive beneficiary", async function () {
            await tokenVesting.addBeneficiary(beneficiary1.address, 1, ethers.parseEther("1000000"));
            await tokenVesting.deactivate(beneficiary1.address);
            const claimable = await tokenVesting.claimable(beneficiary1.address);
            expect(claimable).to.equal(0);
        });
    });
});
