const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("TestTokenStaking - Unit Tests", function () {
    let testToken;
    let staking;
    let owner;
    let addr1;
    let addr2;
    let addrs;

    const STAKE_AMOUNT = ethers.parseEther("1000");
    const LARGE_STAKE = ethers.parseEther("10000");
    const MIN_STAKE = ethers.parseEther("100");
    const DAY_IN_SECONDS = 24 * 60 * 60;

    beforeEach(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        // Deploy TestToken
        const TestToken = await ethers.getContractFactory("TestToken");
        testToken = await TestToken.deploy(owner.address);
        await testToken.waitForDeployment();

        // Deploy Staking
        const TestTokenStaking = await ethers.getContractFactory("TestTokenStaking");
        staking = await TestTokenStaking.deploy(await testToken.getAddress(), owner.address);
        await staking.waitForDeployment();

        // Transfer tokens to users
        await testToken.transfer(addr1.address, ethers.parseEther("50000"));
        await testToken.transfer(addr2.address, ethers.parseEther("50000"));
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await staking.hasRole(await staking.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
        });

        it("Should set correct test token address", async function () {
            expect(await staking.testToken()).to.equal(await testToken.getAddress());
        });

        it("Should initialize with correct constants", async function () {
            expect(await staking.MIN_STAKE_AMOUNT()).to.equal(ethers.parseEther("100"));
            expect(await staking.MAX_STAKE_DURATION()).to.equal(365 * DAY_IN_SECONDS);
            expect(await staking.MIN_STAKE_DURATION()).to.equal(30 * DAY_IN_SECONDS);
        });

        it("Should initialize pool with default values", async function () {
            const poolInfo = await staking.getPoolInfo();
            expect(poolInfo.totalStaked).to.equal(0);
            expect(poolInfo.rewardRate).to.equal(10); // 10% APY
            expect(poolInfo.totalRewards).to.equal(0);
        });
    });

    describe("Staking", function () {
        beforeEach(async function () {
            await testToken.connect(addr1).approve(await staking.getAddress(), STAKE_AMOUNT);
        });

        it("Should stake tokens correctly", async function () {
            await staking.connect(addr1).stake(STAKE_AMOUNT, 30 * DAY_IN_SECONDS);

            const stakeInfo = await staking.getStakeInfo(addr1.address);
            expect(stakeInfo.amount).to.equal(STAKE_AMOUNT);
            expect(stakeInfo.duration).to.equal(30 * DAY_IN_SECONDS);
            expect(stakeInfo.active).to.be.true;
        });

        it("Should emit Staked event", async function () {
            await expect(staking.connect(addr1).stake(STAKE_AMOUNT, 30 * DAY_IN_SECONDS))
                .to.emit(staking, "Staked")
                .withArgs(addr1.address, STAKE_AMOUNT, 30 * DAY_IN_SECONDS);
        });

        it("Should not stake below minimum amount", async function () {
            const smallAmount = ethers.parseEther("50");
            await testToken.connect(addr1).approve(await staking.getAddress(), smallAmount);
            
            await expect(staking.connect(addr1).stake(smallAmount, 30 * DAY_IN_SECONDS))
                .to.be.revertedWith("Amount too low");
        });

        it("Should not stake with invalid duration", async function () {
            // Too short
            await expect(staking.connect(addr1).stake(STAKE_AMOUNT, 29 * DAY_IN_SECONDS))
                .to.be.revertedWithCustomError(staking, "InvalidDuration");

            // Too long
            await expect(staking.connect(addr1).stake(STAKE_AMOUNT, 366 * DAY_IN_SECONDS))
                .to.be.revertedWithCustomError(staking, "InvalidDuration");
        });

        it("Should not stake when already staking", async function () {
            await staking.connect(addr1).stake(STAKE_AMOUNT, 30 * DAY_IN_SECONDS);
            
            await testToken.connect(addr1).approve(await staking.getAddress(), STAKE_AMOUNT);
            await expect(staking.connect(addr1).stake(STAKE_AMOUNT, 30 * DAY_IN_SECONDS))
                .to.be.revertedWithCustomError(staking, "StakingAlreadyActive");
        });

        it("Should update pool info correctly", async function () {
            await staking.connect(addr1).stake(STAKE_AMOUNT, 30 * DAY_IN_SECONDS);

            const poolInfo = await staking.getPoolInfo();
            expect(poolInfo.totalStaked).to.equal(STAKE_AMOUNT);
        });
    });

    describe("VIP System", function () {
        beforeEach(async function () {
            await testToken.connect(addr1).approve(await staking.getAddress(), LARGE_STAKE);
        });

        it("Should calculate VIP level correctly", async function () {
            // Tier 1: 1000 THB
            await staking.connect(addr1).stake(ethers.parseEther("1000"), 30 * DAY_IN_SECONDS);
            expect(await staking.getVIPLevel(addr1.address)).to.equal(1);

            // Tier 2: 5000 THB
            await testToken.connect(addr2).approve(await staking.getAddress(), ethers.parseEther("5000"));
            await staking.connect(addr2).stake(ethers.parseEther("5000"), 30 * DAY_IN_SECONDS);
            expect(await staking.getVIPLevel(addr2.address)).to.equal(2);
        });

        it("Should return zero VIP level for non-staker", async function () {
            expect(await staking.getVIPLevel(addr1.address)).to.equal(0);
        });

        it("Should calculate higher reward rate for VIP", async function () {
            await staking.connect(addr1).stake(LARGE_STAKE, 30 * DAY_IN_SECONDS);
            
            const stakeInfo = await staking.getStakeInfo(addr1.address);
            expect(stakeInfo.rewardRate).to.be.greaterThan(10); // Higher than base 10%
        });
    });

    describe("Reward Calculations", function () {
        beforeEach(async function () {
            await testToken.connect(addr1).approve(await staking.getAddress(), STAKE_AMOUNT);
            await staking.connect(addr1).stake(STAKE_AMOUNT, 30 * DAY_IN_SECONDS);
        });

        it("Should calculate pending reward correctly", async function () {
            // Fast forward 15 days
            await time.increase(15 * DAY_IN_SECONDS);
            
            const pendingReward = await staking.getPendingReward(addr1.address);
            expect(pendingReward).to.be.greaterThan(0);
        });

        it("Should return zero reward for non-staker", async function () {
            const pendingReward = await staking.getPendingReward(addr2.address);
            expect(pendingReward).to.equal(0);
        });

        it("Should calculate staking power correctly", async function () {
            const stakingPower = await staking.getStakingPower(addr1.address);
            expect(stakingPower).to.be.greaterThan(0);
        });

        it("Should return zero staking power for non-staker", async function () {
            const stakingPower = await staking.getStakingPower(addr2.address);
            expect(stakingPower).to.equal(0);
        });
    });

    describe("Unstaking", function () {
        beforeEach(async function () {
            await testToken.connect(addr1).approve(await staking.getAddress(), STAKE_AMOUNT);
            await staking.connect(addr1).stake(STAKE_AMOUNT, 30 * DAY_IN_SECONDS);
        });

        it("Should unstake correctly after duration", async function () {
            // Fast forward 30 days
            await time.increase(30 * DAY_IN_SECONDS);
            
            // Mint rewards to staking contract
            await testToken.mint(await staking.getAddress(), ethers.parseEther("1000"), "Rewards");

            const balanceBefore = await testToken.balanceOf(addr1.address);
            await staking.connect(addr1).unstake();
            const balanceAfter = await testToken.balanceOf(addr1.address);

            expect(balanceAfter).to.be.greaterThan(balanceBefore);
        });

        it("Should emit Unstaked event", async function () {
            // Fast forward 30 days
            await time.increase(30 * DAY_IN_SECONDS);
            
            // Mint rewards
            await testToken.mint(await staking.getAddress(), ethers.parseEther("1000"), "Rewards");

            await expect(staking.connect(addr1).unstake())
                .to.emit(staking, "Unstaked");
        });

        it("Should not unstake when not staking", async function () {
            await expect(staking.connect(addr2).unstake())
                .to.be.revertedWithCustomError(staking, "StakingNotActive");
        });

        it("Should reset stake info after unstaking", async function () {
            // Fast forward 30 days
            await time.increase(30 * DAY_IN_SECONDS);
            
            // Mint rewards
            await testToken.mint(await staking.getAddress(), ethers.parseEther("1000"), "Rewards");

            await staking.connect(addr1).unstake();

            const stakeInfo = await staking.getStakeInfo(addr1.address);
            expect(stakeInfo.active).to.be.false;
            expect(stakeInfo.amount).to.equal(0);
        });

        it("Should update pool info after unstaking", async function () {
            // Fast forward 30 days
            await time.increase(30 * DAY_IN_SECONDS);
            
            // Mint rewards
            await testToken.mint(await staking.getAddress(), ethers.parseEther("1000"), "Rewards");

            await staking.connect(addr1).unstake();

            const poolInfo = await staking.getPoolInfo();
            expect(poolInfo.totalStaked).to.equal(0);
        });
    });

    describe("Emergency Unstaking", function () {
        beforeEach(async function () {
            await testToken.connect(addr1).approve(await staking.getAddress(), STAKE_AMOUNT);
            await staking.connect(addr1).stake(STAKE_AMOUNT, 30 * DAY_IN_SECONDS);
        });

        it("Should emergency unstake correctly", async function () {
            const balanceBefore = await testToken.balanceOf(addr1.address);
            await staking.connect(addr1).emergencyUnstake();
            const balanceAfter = await testToken.balanceOf(addr1.address);

            expect(balanceAfter - balanceBefore).to.equal(STAKE_AMOUNT);
        });

        it("Should not give rewards on emergency unstake", async function () {
            // Fast forward 15 days
            await time.increase(15 * DAY_IN_SECONDS);
            
            // Mint rewards
            await testToken.mint(await staking.getAddress(), ethers.parseEther("1000"), "Rewards");

            const balanceBefore = await testToken.balanceOf(addr1.address);
            await staking.connect(addr1).emergencyUnstake();
            const balanceAfter = await testToken.balanceOf(addr1.address);

            // Should only get back principal, no rewards
            expect(balanceAfter - balanceBefore).to.equal(STAKE_AMOUNT);
        });

        it("Should not emergency unstake when not staking", async function () {
            await expect(staking.connect(addr2).emergencyUnstake())
                .to.be.revertedWithCustomError(staking, "StakingNotActive");
        });
    });

    describe("Reward Claiming", function () {
        beforeEach(async function () {
            await testToken.connect(addr1).approve(await staking.getAddress(), STAKE_AMOUNT);
            await staking.connect(addr1).stake(STAKE_AMOUNT, 30 * DAY_IN_SECONDS);
            
            // Fast forward 15 days
            await time.increase(15 * DAY_IN_SECONDS);
            
            // Mint rewards
            await testToken.mint(await staking.getAddress(), ethers.parseEther("1000"), "Rewards");
        });

        it("Should claim reward correctly", async function () {
            const balanceBefore = await testToken.balanceOf(addr1.address);
            await staking.connect(addr1).claimReward();
            const balanceAfter = await testToken.balanceOf(addr1.address);

            expect(balanceAfter).to.be.greaterThan(balanceBefore);
        });

        it("Should emit RewardClaimed event", async function () {
            await expect(staking.connect(addr1).claimReward())
                .to.emit(staking, "RewardClaimed");
        });

        it("Should not claim when not staking", async function () {
            await expect(staking.connect(addr2).claimReward())
                .to.be.revertedWithCustomError(staking, "StakingNotActive");
        });

        it("Should not claim when no reward", async function () {
            // Claim once
            await staking.connect(addr1).claimReward();
            
            // Try to claim again immediately
            await expect(staking.connect(addr1).claimReward())
                .to.be.revertedWith("No reward to claim");
        });
    });

    describe("Admin Functions", function () {
        it("Should set reward rate correctly", async function () {
            await staking.setRewardRate(15); // 15% APY
            
            const poolInfo = await staking.getPoolInfo();
            expect(poolInfo.rewardRate).to.equal(15);
        });

        it("Should emit PoolUpdated event", async function () {
            await expect(staking.setRewardRate(15))
                .to.emit(staking, "PoolUpdated")
                .withArgs(15, 0);
        });

        it("Should only allow STAKING_MANAGER_ROLE to set reward rate", async function () {
            await expect(staking.connect(addr1).setRewardRate(15))
                .to.be.revertedWithCustomError(staking, "Unauthorized");
        });

        it("Should set VIP thresholds correctly", async function () {
            const newThresholds = [2000, 10000, 20000, 100000, 200000];
            const newRates = [6, 10, 15, 20, 30];
            
            await staking.setVIPThresholds(newThresholds, newRates);
            
            // Test with new threshold
            await testToken.connect(addr1).approve(await staking.getAddress(), ethers.parseEther("2000"));
            await staking.connect(addr1).stake(ethers.parseEther("2000"), 30 * DAY_IN_SECONDS);
            
            expect(await staking.getVIPLevel(addr1.address)).to.equal(1);
        });

        it("Should only allow STAKING_MANAGER_ROLE to set VIP thresholds", async function () {
            const newThresholds = [2000, 10000];
            const newRates = [6, 10];
            
            await expect(staking.connect(addr1).setVIPThresholds(newThresholds, newRates))
                .to.be.revertedWithCustomError(staking, "Unauthorized");
        });
    });

    describe("View Functions", function () {
        beforeEach(async function () {
            await testToken.connect(addr1).approve(await staking.getAddress(), STAKE_AMOUNT);
            await staking.connect(addr1).stake(STAKE_AMOUNT, 30 * DAY_IN_SECONDS);
        });

        it("Should return correct stake info", async function () {
            const stakeInfo = await staking.getStakeInfo(addr1.address);
            expect(stakeInfo.amount).to.equal(STAKE_AMOUNT);
            expect(stakeInfo.duration).to.equal(30 * DAY_IN_SECONDS);
            expect(stakeInfo.active).to.be.true;
        });

        it("Should return correct pool info", async function () {
            const poolInfo = await staking.getPoolInfo();
            expect(poolInfo.totalStaked).to.equal(STAKE_AMOUNT);
            expect(poolInfo.rewardRate).to.equal(10);
        });

        it("Should return zero for non-staker", async function () {
            const stakeInfo = await staking.getStakeInfo(addr2.address);
            expect(stakeInfo.amount).to.equal(0);
            expect(stakeInfo.active).to.be.false;
        });
    });

    describe("Edge Cases", function () {
        it("Should handle minimum stake amount", async function () {
            await testToken.connect(addr1).approve(await staking.getAddress(), MIN_STAKE);
            await staking.connect(addr1).stake(MIN_STAKE, 30 * DAY_IN_SECONDS);
            
            const stakeInfo = await staking.getStakeInfo(addr1.address);
            expect(stakeInfo.amount).to.equal(MIN_STAKE);
        });

        it("Should handle maximum stake duration", async function () {
            await testToken.connect(addr1).approve(await staking.getAddress(), STAKE_AMOUNT);
            await staking.connect(addr1).stake(STAKE_AMOUNT, 365 * DAY_IN_SECONDS);
            
            const stakeInfo = await staking.getStakeInfo(addr1.address);
            expect(stakeInfo.duration).to.equal(365 * DAY_IN_SECONDS);
        });

        it("Should handle very large stake amounts", async function () {
            const hugeAmount = ethers.parseEther("1000000");
            await testToken.mint(addr1.address, hugeAmount, "Large stake");
            await testToken.connect(addr1).approve(await staking.getAddress(), hugeAmount);
            
            await staking.connect(addr1).stake(hugeAmount, 30 * DAY_IN_SECONDS);
            
            const stakeInfo = await staking.getStakeInfo(addr1.address);
            expect(stakeInfo.amount).to.equal(hugeAmount);
        });

        it("Should handle multiple stakers", async function () {
            await testToken.connect(addr1).approve(await staking.getAddress(), STAKE_AMOUNT);
            await testToken.connect(addr2).approve(await staking.getAddress(), STAKE_AMOUNT);
            
            await staking.connect(addr1).stake(STAKE_AMOUNT, 30 * DAY_IN_SECONDS);
            await staking.connect(addr2).stake(STAKE_AMOUNT, 30 * DAY_IN_SECONDS);
            
            const poolInfo = await staking.getPoolInfo();
            expect(poolInfo.totalStaked).to.equal(STAKE_AMOUNT * 2n);
        });
    });
});
