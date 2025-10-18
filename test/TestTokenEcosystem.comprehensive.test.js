const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Test Token Ecosystem - Comprehensive Test Suite", function () {
    let testToken;
    let vesting;
    let staking;
    let governance;
    let buybackBurn;
    let owner;
    let addr1;
    let addr2;
    let addr3;
    let addrs;

    const TOTAL_SUPPLY = ethers.parseEther("100000000"); // 100M THB
    const MAX_SUPPLY = ethers.parseEther("150000000"); // 150M THB
    const STAKE_AMOUNT = ethers.parseEther("1000");
    const VESTING_AMOUNT = ethers.parseEther("10000");
    const MONTH_IN_SECONDS = 30 * 24 * 60 * 60;

    beforeEach(async function () {
        [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();

        // Deploy all contracts
        const TestToken = await ethers.getContractFactory("TestToken");
        testToken = await TestToken.deploy(owner.address);
        await testToken.waitForDeployment();

        const TestTokenVesting = await ethers.getContractFactory("TestTokenVesting");
        vesting = await TestTokenVesting.deploy(await testToken.getAddress(), owner.address);
        await vesting.waitForDeployment();

        const TestTokenStaking = await ethers.getContractFactory("TestTokenStaking");
        staking = await TestTokenStaking.deploy(await testToken.getAddress(), owner.address);
        await staking.waitForDeployment();

        const TestTokenGovernance = await ethers.getContractFactory("TestTokenGovernance");
        governance = await TestTokenGovernance.deploy(await testToken.getAddress(), owner.address);
        await governance.waitForDeployment();

        const TestTokenBuybackBurn = await ethers.getContractFactory("TestTokenBuybackBurn");
        const mockStablecoin = "0x55d398326f99059fF775485246999027B3197955";
        const mockRouter = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
        const mockOracle = "0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE";
        
        buybackBurn = await TestTokenBuybackBurn.deploy(
            await testToken.getAddress(),
            mockStablecoin,
            mockRouter,
            mockOracle,
            owner.address
        );
        await buybackBurn.waitForDeployment();

        // Setup contract connections
        await testToken.setVestingContract(await vesting.getAddress());
        await testToken.setStakingContract(await staking.getAddress());
        await testToken.setGovernanceContract(await governance.getAddress());
        await testToken.setBuybackContract(await buybackBurn.getAddress());

        // Approve contracts for operations
        await testToken.approve(await vesting.getAddress(), ethers.parseEther("100000000"));
        await testToken.approve(await staking.getAddress(), ethers.parseEther("100000000"));
    });

    describe("Tokenomic Implementation", function () {
        it("Should implement complete token allocation according to tokenomic", async function () {
            // Team & Advisors: 7% (7M THB)
            await vesting.createVestingSchedule(
                addr1.address, // Team address
                ethers.parseEther("7000000"),
                0, // 0% TGE
                6 * MONTH_IN_SECONDS, // 6 months cliff
                36 * MONTH_IN_SECONDS, // 36 months vesting
                "Team"
            );

            // Node OG: 3% (3M THB)
            await vesting.createVestingSchedule(
                addr2.address, // Node OG address
                ethers.parseEther("3000000"),
                10, // 10% TGE
                0, // No cliff
                24 * MONTH_IN_SECONDS, // 24 months vesting
                "Node OG"
            );

            // Liquidity & Market Making: 15% (15M THB)
            await vesting.createVestingSchedule(
                addr3.address, // Liquidity address
                ethers.parseEther("15000000"),
                40, // 40% TGE
                0, // No cliff
                12 * MONTH_IN_SECONDS, // 12 months vesting
                "Liquidity"
            );

            // Community & Marketing: 20% (20M THB)
            await vesting.createVestingSchedule(
                owner.address, // Community address
                ethers.parseEther("20000000"),
                20, // 20% TGE
                0, // No cliff
                24 * MONTH_IN_SECONDS, // 24 months vesting
                "Community"
            );

            // Staking & Rewards: 10% (10M THB)
            await testToken.mint(await staking.getAddress(), ethers.parseEther("10000000"), "Staking rewards");

            // Ecosystem & Partnerships: 25% (25M THB)
            await vesting.createVestingSchedule(
                owner.address, // Ecosystem address
                ethers.parseEther("25000000"),
                10, // 10% TGE
                0, // No cliff
                30 * MONTH_IN_SECONDS, // 30 months vesting
                "Ecosystem"
            );

            // Treasury / Reserve Fund: 20% (20M THB)
            await vesting.createVestingSchedule(
                owner.address, // Treasury address
                ethers.parseEther("20000000"),
                20, // 20% TGE
                0, // No cliff
                48 * MONTH_IN_SECONDS, // 48 months vesting
                "Treasury"
            );

            // Verify total allocation
            const totalVested = await vesting.getTotalVested();
            const expectedTotal = ethers.parseEther("100000000"); // 100M THB
            expect(totalVested).to.equal(expectedTotal);

            // Verify category allocations
            expect(await vesting.getCategoryAllocation("Team")).to.equal(ethers.parseEther("7000000"));
            expect(await vesting.getCategoryAllocation("Node OG")).to.equal(ethers.parseEther("3000000"));
            expect(await vesting.getCategoryAllocation("Liquidity")).to.equal(ethers.parseEther("15000000"));
            expect(await vesting.getCategoryAllocation("Community")).to.equal(ethers.parseEther("20000000"));
            expect(await vesting.getCategoryAllocation("Ecosystem")).to.equal(ethers.parseEther("25000000"));
            expect(await vesting.getCategoryAllocation("Treasury")).to.equal(ethers.parseEther("20000000"));
        });

        it("Should handle TGE releases correctly", async function () {
            // Create vesting with TGE
            await vesting.createVestingSchedule(
                addr1.address,
                ethers.parseEther("1000000"),
                20, // 20% TGE
                0, // No cliff
                12 * MONTH_IN_SECONDS, // 12 months vesting
                "Test"
            );

            // Check TGE release
            const tgeAmount = ethers.parseEther("200000"); // 20% of 1M
            expect(await testToken.balanceOf(addr1.address)).to.equal(tgeAmount);

            // Check total released
            expect(await vesting.getTotalReleased()).to.equal(tgeAmount);
        });

        it("Should handle cliff periods correctly", async function () {
            // Create vesting with cliff
            await vesting.createVestingSchedule(
                addr1.address,
                ethers.parseEther("1000000"),
                0, // No TGE
                6 * MONTH_IN_SECONDS, // 6 months cliff
                12 * MONTH_IN_SECONDS, // 12 months vesting
                "Test"
            );

            // Before cliff
            await time.increase(3 * MONTH_IN_SECONDS);
            expect(await vesting.getVestedAmount(addr1.address)).to.equal(0);

            // After cliff
            await time.increase(3 * MONTH_IN_SECONDS + 1);
            const vestedAmount = await vesting.getVestedAmount(addr1.address);
            expect(vestedAmount).to.be.greaterThan(0);
        });
    });

    describe("VIP System Implementation", function () {
        it("Should implement VIP tiers correctly", async function () {
            const vipAmounts = [
                ethers.parseEther("1000"),   // Tier 1
                ethers.parseEther("5000"),   // Tier 2
                ethers.parseEther("10000"),  // Tier 3
                ethers.parseEther("20000"),  // Tier 4
                ethers.parseEther("50000")   // Tier 5
            ];

            for (let i = 0; i < vipAmounts.length; i++) {
                await testToken.transfer(addrs[i].address, vipAmounts[i]);
                await testToken.connect(addrs[i]).approve(await staking.getAddress(), vipAmounts[i]);
                await staking.connect(addrs[i]).stake(vipAmounts[i], 30 * 24 * 60 * 60);

                const vipLevel = await staking.getVIPLevel(addrs[i].address);
                expect(vipLevel).to.equal(i + 1);
            }
        });

        it("Should provide higher rewards for VIP tiers", async function () {
            const regularAmount = ethers.parseEther("1000");
            const vipAmount = ethers.parseEther("10000");

            // Regular staker
            await testToken.transfer(addr1.address, regularAmount);
            await testToken.connect(addr1).approve(await staking.getAddress(), regularAmount);
            await staking.connect(addr1).stake(regularAmount, 30 * 24 * 60 * 60);

            // VIP staker
            await testToken.transfer(addr2.address, vipAmount);
            await testToken.connect(addr2).approve(await staking.getAddress(), vipAmount);
            await staking.connect(addr2).stake(vipAmount, 30 * 24 * 60 * 60);

            // Fast forward 15 days
            await time.increase(15 * 24 * 60 * 60);

            const regularReward = await staking.getPendingReward(addr1.address);
            const vipReward = await staking.getPendingReward(addr2.address);

            // VIP should have higher reward rate
            expect(vipReward).to.be.greaterThan(regularReward);
        });
    });

    describe("Governance System", function () {
        it("Should implement DAO governance correctly", async function () {
            // Create multiple proposals
            await governance.propose("List new trading pair: THB/USDT");
            await governance.propose("Increase staking reward rate to 15%");
            await governance.propose("Allocate 5M THB for marketing campaign");

            // Fast forward past voting delay
            await time.increase(24 * 60 * 60 + 1);

            // Vote on proposals
            await governance.vote(0, true);  // Support listing
            await governance.vote(1, false); // Against rate increase
            await governance.vote(2, true);  // Support marketing

            // Fast forward past voting period
            await time.increase(3 * 24 * 60 * 60 + 1);

            // Execute supported proposals
            await governance.execute(0); // Should succeed
            await governance.execute(2); // Should succeed

            // Try to execute rejected proposal
            await expect(governance.execute(1)).to.be.revertedWith("Proposal rejected");

            // Verify execution
            expect(await governance.getProposalCount()).to.equal(3);
        });

        it("Should handle quorum requirements", async function () {
            // Create proposal
            await governance.propose("Test quorum requirement");

            // Fast forward past voting delay
            await time.increase(24 * 60 * 60 + 1);

            // Vote with insufficient participation
            await governance.vote(0, true);

            // Fast forward past voting period
            await time.increase(3 * 24 * 60 * 60 + 1);

            // Should fail due to insufficient quorum
            await expect(governance.execute(0)).to.be.revertedWith("Quorum not met");
        });
    });

    describe("Buyback and Burn Mechanism", function () {
        it("Should implement deflationary mechanism", async function () {
            const initialSupply = await testToken.totalSupply();
            
            // Transfer tokens to buyback contract
            await testToken.transfer(await buybackBurn.getAddress(), ethers.parseEther("10000"));

            // Execute burn
            await buybackBurn.executeBurn(ethers.parseEther("10000"));

            const finalSupply = await testToken.totalSupply();
            const totalBurned = await buybackBurn.getTotalBurned();

            expect(finalSupply).to.be.lessThan(initialSupply);
            expect(totalBurned).to.equal(ethers.parseEther("10000"));
        });

        it("Should handle automatic buyback and burn", async function () {
            // Enable auto mode
            await buybackBurn.toggleAutoMode();

            // Transfer tokens for buyback simulation
            await testToken.transfer(await buybackBurn.getAddress(), ethers.parseEther("5000"));

            // Fast forward past buyback interval
            await time.increase(7 * 24 * 60 * 60 + 1);

            // Execute auto buyback (will burn 50% of bought tokens)
            await buybackBurn.executeAutoBuyback();

            const totalBurned = await buybackBurn.getTotalBurned();
            expect(totalBurned).to.be.greaterThan(0);
        });
    });

    describe("Fee Discount System", function () {
        it("Should implement fee discounts for token holders", async function () {
            // Set fee discounts for different users
            await testToken.setFeeDiscount(addr1.address, 10); // 10% discount
            await testToken.setFeeDiscount(addr2.address, 25); // 25% discount
            await testToken.setFeeDiscount(addr3.address, 50); // 50% discount

            // Verify fee discounts
            expect(await testToken.feeDiscount(addr1.address)).to.equal(10);
            expect(await testToken.feeDiscount(addr2.address)).to.equal(25);
            expect(await testToken.feeDiscount(addr3.address)).to.equal(50);
        });

        it("Should not allow invalid fee discounts", async function () {
            await expect(testToken.setFeeDiscount(addr1.address, 101))
                .to.be.revertedWith("Invalid discount");
        });
    });

    describe("Security and Access Control", function () {
        it("Should enforce proper role-based access control", async function () {
            // Test unauthorized access attempts
            await expect(testToken.connect(addr1).mint(addr2.address, ethers.parseEther("1000"), "Test"))
                .to.be.revertedWithCustomError(testToken, "Unauthorized");

            await expect(vesting.connect(addr1).createVestingSchedule(
                addr2.address,
                ethers.parseEther("1000"),
                0,
                0,
                12 * MONTH_IN_SECONDS,
                "Test"
            )).to.be.revertedWithCustomError(vesting, "Unauthorized");

            await expect(staking.connect(addr1).setRewardRate(15))
                .to.be.revertedWithCustomError(staking, "Unauthorized");

            await expect(governance.connect(addr1).setQuorumPercentage(20))
                .to.be.revertedWithCustomError(governance, "Unauthorized");

            await expect(buybackBurn.connect(addr1).setBuybackBudget(ethers.parseEther("20000")))
                .to.be.revertedWithCustomError(buybackBurn, "Unauthorized");
        });

        it("Should handle role management correctly", async function () {
            // Grant roles to new addresses
            await testToken.grantRole(await testToken.MINTER_ROLE(), addr1.address);
            await vesting.grantRole(await vesting.VESTING_MANAGER_ROLE(), addr1.address);
            await staking.grantRole(await staking.STAKING_MANAGER_ROLE(), addr1.address);
            await governance.grantRole(await governance.PROPOSER_ROLE(), addr1.address);
            await buybackBurn.grantRole(await buybackBurn.BUYBACK_MANAGER_ROLE(), addr1.address);

            // Verify new addresses can perform actions
            await testToken.connect(addr1).mint(addr2.address, ethers.parseEther("1000"), "Test");
            await vesting.connect(addr1).createVestingSchedule(
                addr2.address,
                ethers.parseEther("1000"),
                0,
                0,
                12 * MONTH_IN_SECONDS,
                "Test"
            );
            await staking.connect(addr1).setRewardRate(15);
            await governance.connect(addr1).propose("Test proposal");
            await buybackBurn.connect(addr1).setBuybackBudget(ethers.parseEther("20000"));

            // Verify actions worked
            expect(await testToken.balanceOf(addr2.address)).to.equal(ethers.parseEther("1000"));
            expect(await staking.getPoolInfo()).to.not.be.undefined;
            expect(await governance.getProposalCount()).to.equal(1);
        });
    });

    describe("Pause and Emergency Functions", function () {
        it("Should handle emergency pause correctly", async function () {
            // Pause token
            await testToken.pause();

            // Verify paused state
            expect(await testToken.paused()).to.be.true;

            // Verify operations are blocked
            await expect(testToken.transfer(addr1.address, ethers.parseEther("1000")))
                .to.be.revertedWithCustomError(testToken, "ContractPaused");

            await expect(testToken.mint(addr1.address, ethers.parseEther("1000"), "Test"))
                .to.be.revertedWithCustomError(testToken, "ContractPaused");

            // Unpause token
            await testToken.unpause();

            // Verify operations work again
            expect(await testToken.paused()).to.be.false;
            await testToken.transfer(addr1.address, ethers.parseEther("1000"));
        });

        it("Should handle emergency withdrawal", async function () {
            // Transfer tokens to buyback contract
            await testToken.transfer(await buybackBurn.getAddress(), ethers.parseEther("10000"));

            // Emergency withdraw
            const balanceBefore = await testToken.balanceOf(owner.address);
            await buybackBurn.emergencyWithdraw();
            const balanceAfter = await testToken.balanceOf(owner.address);

            expect(balanceAfter).to.be.greaterThan(balanceBefore);
            expect(await testToken.balanceOf(await buybackBurn.getAddress())).to.equal(0);
        });
    });

    describe("Blacklist System", function () {
        it("Should handle blacklist functionality", async function () {
            // Blacklist address
            await testToken.setBlacklisted(addr1.address, true);
            expect(await testToken.blacklisted(addr1.address)).to.be.true;

            // Verify blacklisted address cannot perform operations
            await expect(testToken.connect(addr1).transfer(addr2.address, ethers.parseEther("1000")))
                .to.be.revertedWithCustomError(testToken, "Blacklisted");

            await expect(testToken.mint(addr1.address, ethers.parseEther("1000"), "Test"))
                .to.be.revertedWithCustomError(testToken, "Blacklisted");

            // Remove from blacklist
            await testToken.setBlacklisted(addr1.address, false);
            expect(await testToken.blacklisted(addr1.address)).to.be.false;

            // Verify operations work again
            await testToken.transfer(addr1.address, ethers.parseEther("1000"));
            await testToken.mint(addr1.address, ethers.parseEther("1000"), "Test");
        });
    });

    describe("Complete Ecosystem Stress Test", function () {
        it("Should handle maximum complexity scenario", async function () {
            const users = addrs.slice(0, 10);
            const amounts = [
                ethers.parseEther("1000"),
                ethers.parseEther("5000"),
                ethers.parseEther("10000"),
                ethers.parseEther("20000"),
                ethers.parseEther("50000"),
                ethers.parseEther("100000"),
                ethers.parseEther("200000"),
                ethers.parseEther("500000"),
                ethers.parseEther("1000000"),
                ethers.parseEther("2000000")
            ];

            // 1. Create vesting schedules for all users
            for (let i = 0; i < users.length; i++) {
                await vesting.createVestingSchedule(
                    users[i].address,
                    amounts[i],
                    i * 5, // Varying TGE percentages
                    0,
                    12 * MONTH_IN_SECONDS,
                    `Category${i}`
                );
            }

            // 2. Transfer tokens and stake
            for (let i = 0; i < users.length; i++) {
                await testToken.transfer(users[i].address, amounts[i]);
                await testToken.connect(users[i]).approve(await staking.getAddress(), amounts[i]);
                await staking.connect(users[i]).stake(amounts[i], (30 + i * 30) * 24 * 60 * 60);
            }

            // 3. Create multiple governance proposals
            for (let i = 0; i < 5; i++) {
                await governance.propose(`Complex proposal ${i} - Ecosystem stress test`);
            }

            // 4. Vote on proposals
            await time.increase(24 * 60 * 60 + 1);
            for (let i = 0; i < users.length; i++) {
                for (let j = 0; j < 5; j++) {
                    await governance.connect(users[i]).vote(j, (i + j) % 2 === 0);
                }
            }

            // 5. Execute proposals
            await time.increase(3 * 24 * 60 * 60 + 1);
            for (let i = 0; i < 5; i++) {
                await governance.execute(i);
            }

            // 6. Release vested tokens
            await time.increase(6 * MONTH_IN_SECONDS);
            for (let i = 0; i < users.length; i++) {
                await vesting.connect(users[i]).release();
            }

            // 7. Unstake tokens
            for (let i = 0; i < users.length; i++) {
                await time.increase((30 + i * 30) * 24 * 60 * 60 + 1);
                await testToken.mint(await staking.getAddress(), ethers.parseEther("10000"), "Rewards");
                await staking.connect(users[i]).unstake();
            }

            // 8. Execute buyback and burn
            await testToken.transfer(await buybackBurn.getAddress(), ethers.parseEther("50000"));
            await buybackBurn.executeBurn(ethers.parseEther("50000"));

            // Verify all systems worked correctly
            expect(await vesting.getBeneficiaryCount()).to.equal(10);
            expect(await vesting.getTotalReleased()).to.be.greaterThan(0);
            expect(await governance.getProposalCount()).to.equal(5);
            expect(await staking.getPoolInfo()).to.not.be.undefined;
            expect(await buybackBurn.getTotalBurned()).to.equal(ethers.parseEther("50000"));

            console.log("✅ Complete ecosystem stress test passed!");
        });
    });
});
