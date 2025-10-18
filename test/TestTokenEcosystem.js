const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Test Token Ecosystem", function () {
    let testToken;
    let vesting;
    let staking;
    let governance;
    let buybackBurn;
    let owner;
    let addr1;
    let addr2;
    let addrs;

    const TOTAL_SUPPLY = ethers.parseEther("100000000"); // 100M THB
    const TEST_AMOUNT = ethers.parseEther("1000");
    const STAKE_AMOUNT = ethers.parseEther("100");

    beforeEach(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        // Deploy TestToken
        const TestToken = await ethers.getContractFactory("TestToken");
        testToken = await TestToken.deploy(owner.address);
        await testToken.waitForDeployment();

        // Deploy Vesting
        const TestTokenVesting = await ethers.getContractFactory("TestTokenVesting");
        vesting = await TestTokenVesting.deploy(await testToken.getAddress(), owner.address);
        await vesting.waitForDeployment();

        // Deploy Staking
        const TestTokenStaking = await ethers.getContractFactory("TestTokenStaking");
        staking = await TestTokenStaking.deploy(await testToken.getAddress(), owner.address);
        await staking.waitForDeployment();

        // Deploy Governance
        const TestTokenGovernance = await ethers.getContractFactory("TestTokenGovernance");
        governance = await TestTokenGovernance.deploy(await testToken.getAddress(), owner.address);
        await governance.waitForDeployment();

        // Deploy BuybackBurn
        const TestTokenBuybackBurn = await ethers.getContractFactory("TestTokenBuybackBurn");
        
        // Mock addresses for testing
        const mockStablecoin = "0x55d398326f99059fF775485246999027B3197955"; // BUSD
        const mockRouter = "0x10ED43C718714eb63d5aA57B78B54704E256024E"; // PancakeSwap
        const mockOracle = "0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE"; // BNB/USD
        
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
    });

    describe("TestToken", function () {
        it("Should set the right owner", async function () {
            expect(await testToken.hasRole(await testToken.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
        });

        it("Should set the correct token info", async function () {
            const tokenInfo = await testToken.getTokenInfo();
            expect(tokenInfo.name).to.equal("Test Token");
            expect(tokenInfo.symbol).to.equal("THB");
            expect(tokenInfo.decimals).to.equal(18);
            expect(tokenInfo.totalSupply_).to.equal(TOTAL_SUPPLY);
        });

        it("Should mint tokens correctly", async function () {
            await testToken.mint(addr1.address, TEST_AMOUNT, "Test mint");
            expect(await testToken.balanceOf(addr1.address)).to.equal(TEST_AMOUNT);
        });

        it("Should burn tokens correctly", async function () {
            // Transfer tokens to addr1 first
            await testToken.transfer(addr1.address, TEST_AMOUNT);
            await testToken.connect(addr1).burn(TEST_AMOUNT);
            expect(await testToken.balanceOf(addr1.address)).to.equal(0);
        });

        it("Should not allow transfer from blacklisted address", async function () {
            await testToken.setBlacklisted(addr1.address, true);
            await expect(
                testToken.connect(addr1).transfer(addr2.address, TEST_AMOUNT)
            ).to.be.revertedWithCustomError(testToken, "Blacklisted");
        });

        it("Should set fee discount correctly", async function () {
            await testToken.setFeeDiscount(addr1.address, 50);
            expect(await testToken.feeDiscount(addr1.address)).to.equal(50);
        });
    });

    describe("Vesting", function () {
        beforeEach(async function () {
            // Approve vesting contract to spend tokens
            await testToken.approve(await vesting.getAddress(), ethers.parseEther("1000000"));
        });

        it("Should create vesting schedule correctly", async function () {
            await vesting.createVestingSchedule(
                addr1.address,
                ethers.parseEther("100000"),
                10, // 10% TGE
                6 * 30 * 24 * 60 * 60, // 6 months cliff
                36 * 30 * 24 * 60 * 60, // 36 months vesting
                "Team"
            );

            const schedule = await vesting.getVestingSchedule(addr1.address);
            expect(schedule.totalAmount).to.equal(ethers.parseEther("100000"));
            expect(schedule.tgePercentage).to.equal(10);
            expect(schedule.category).to.equal("Team");
        });

        it("Should release TGE amount immediately", async function () {
            await vesting.createVestingSchedule(
                addr1.address,
                ethers.parseEther("100000"),
                10, // 10% TGE
                0, // No cliff
                12 * 30 * 24 * 60 * 60, // 12 months vesting
                "Node OG"
            );

            const balance = await testToken.balanceOf(addr1.address);
            expect(balance).to.equal(ethers.parseEther("10000")); // 10% of 100000
        });

        it("Should calculate vested amount correctly", async function () {
            await vesting.createVestingSchedule(
                addr1.address,
                ethers.parseEther("100000"),
                0, // No TGE
                0, // No cliff
                12 * 30 * 24 * 60 * 60, // 12 months vesting
                "Community"
            );

            // Fast forward 6 months
            await ethers.provider.send("evm_increaseTime", [6 * 30 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine");

            const vestedAmount = await vesting.getVestedAmount(addr1.address);
            expect(vestedAmount).to.be.closeTo(ethers.parseEther("50000"), ethers.parseEther("1000"));
        });
    });

    describe("Staking", function () {
        beforeEach(async function () {
            // Transfer tokens to addr1 for staking
            await testToken.transfer(addr1.address, ethers.parseEther("10000"));
        });

        it("Should stake tokens correctly", async function () {
            await testToken.connect(addr1).approve(await staking.getAddress(), STAKE_AMOUNT);
            await staking.connect(addr1).stake(STAKE_AMOUNT, 30 * 24 * 60 * 60); // 30 days

            const stakeInfo = await staking.getStakeInfo(addr1.address);
            expect(stakeInfo.amount).to.equal(STAKE_AMOUNT);
            expect(stakeInfo.active).to.be.true;
        });

        it("Should calculate VIP level correctly", async function () {
            const largeStake = ethers.parseEther("5000");
            await testToken.connect(addr1).approve(await staking.getAddress(), largeStake);
            await staking.connect(addr1).stake(largeStake, 30 * 24 * 60 * 60);

            const vipLevel = await staking.getVIPLevel(addr1.address);
            expect(vipLevel).to.be.greaterThan(0);
        });

        it("Should calculate pending reward correctly", async function () {
            await testToken.connect(addr1).approve(await staking.getAddress(), STAKE_AMOUNT);
            await staking.connect(addr1).stake(STAKE_AMOUNT, 30 * 24 * 60 * 60);

            // Fast forward 15 days
            await ethers.provider.send("evm_increaseTime", [15 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine");

            const pendingReward = await staking.getPendingReward(addr1.address);
            expect(pendingReward).to.be.greaterThan(0);
        });

        it("Should unstake correctly", async function () {
            await testToken.connect(addr1).approve(await staking.getAddress(), STAKE_AMOUNT);
            await staking.connect(addr1).stake(STAKE_AMOUNT, 30 * 24 * 60 * 60);

            // Fast forward 30 days
            await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine");

            // Mint some tokens to staking contract for rewards
            await testToken.mint(await staking.getAddress(), ethers.parseEther("1000"), "Rewards");

            const balanceBefore = await testToken.balanceOf(addr1.address);
            await staking.connect(addr1).unstake();
            const balanceAfter = await testToken.balanceOf(addr1.address);

            expect(balanceAfter).to.be.greaterThan(balanceBefore);
        });
    });

    describe("Governance", function () {
        it("Should create proposal correctly", async function () {
            await governance.propose("Test proposal for ecosystem");
            const proposal = await governance.getProposal(0);
            expect(proposal.description).to.equal("Test proposal for ecosystem");
            expect(proposal.proposer).to.equal(owner.address);
        });

        it("Should vote on proposal correctly", async function () {
            await governance.propose("Test proposal");
            
            // Fast forward past voting delay
            await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
            await ethers.provider.send("evm_mine");

            await governance.vote(0, true);
            const voteInfo = await governance.getVoteInfo(0, owner.address);
            expect(voteInfo.hasVoted).to.be.true;
            expect(voteInfo.support).to.be.true;
        });

        it("Should calculate voting power correctly", async function () {
            const votingPower = await governance.getVotingPower(owner.address);
            expect(votingPower).to.equal(TOTAL_SUPPLY);
        });

        it("Should get proposal state correctly", async function () {
            await governance.propose("Test proposal");
            const state = await governance.getProposalState(0);
            expect(state).to.equal("Pending");
        });
    });

    describe("Buyback & Burn", function () {
        it("Should execute buyback correctly", async function () {
            // Test buyback contract configuration
            expect(await buybackBurn.buybackBudget()).to.equal(ethers.parseEther("10000"));
            expect(await buybackBurn.maxSlippage()).to.equal(500);
            expect(await buybackBurn.autoMode()).to.be.false;
            
            // Test that buyback fails without stablecoin balance
            await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
            await ethers.provider.send("evm_mine");
            
            await expect(buybackBurn.executeBuyback()).to.be.reverted;
        });

        it("Should execute burn correctly", async function () {
            const burnAmount = ethers.parseEther("1000");
            await testToken.transfer(await buybackBurn.getAddress(), burnAmount);
            
            await buybackBurn.executeBurn(burnAmount);
            const buybackInfo = await buybackBurn.getBuybackInfo();
            expect(buybackInfo.totalBurned).to.equal(burnAmount);
        });

        it("Should toggle auto mode correctly", async function () {
            await buybackBurn.toggleAutoMode();
            expect(await buybackBurn.isAutoMode()).to.be.true;
        });

        it("Should set buyback budget correctly", async function () {
            const newBudget = ethers.parseEther("5000");
            await buybackBurn.setBuybackBudget(newBudget);
            expect(await buybackBurn.buybackBudget()).to.equal(newBudget);
        });
    });

    describe("Integration Tests", function () {
        it("Should work together as ecosystem", async function () {
            // 1. Create vesting schedule
            await testToken.approve(await vesting.getAddress(), ethers.parseEther("100000"));
            await vesting.createVestingSchedule(
                addr1.address,
                ethers.parseEther("10000"),
                10,
                0,
                12 * 30 * 24 * 60 * 60,
                "Team"
            );

            // 2. Stake tokens
            await testToken.transfer(addr2.address, ethers.parseEther("10000"));
            await testToken.connect(addr2).approve(await staking.getAddress(), ethers.parseEther("1000"));
            await staking.connect(addr2).stake(ethers.parseEther("1000"), 30 * 24 * 60 * 60);

            // 3. Create governance proposal
            await governance.propose("Ecosystem integration test");

            // 4. Test buyback configuration
            expect(await buybackBurn.buybackBudget()).to.equal(ethers.parseEther("10000"));
            expect(await buybackBurn.canExecuteBuyback()).to.be.false; // No stablecoin balance

            // All should work together
            expect(await testToken.balanceOf(addr1.address)).to.be.greaterThan(0);
            expect(await staking.getStakeInfo(addr2.address)).to.not.be.undefined;
            expect(await governance.getProposalCount()).to.equal(1);
            expect(await buybackBurn.getTotalBought()).to.equal(0); // No buyback executed yet
        });
    });
});
