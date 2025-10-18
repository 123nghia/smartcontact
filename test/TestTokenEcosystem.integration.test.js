const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Test Token Ecosystem - Integration Tests", function () {
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
    const STAKE_AMOUNT = ethers.parseEther("1000");
    const VESTING_AMOUNT = ethers.parseEther("10000");
    const MONTH_IN_SECONDS = 30 * 24 * 60 * 60;

    beforeEach(async function () {
        [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();

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

        // Approve contracts
        await testToken.approve(await vesting.getAddress(), ethers.parseEther("1000000"));
        await testToken.approve(await staking.getAddress(), ethers.parseEther("1000000"));
    });

    describe("Complete Ecosystem Workflow", function () {
        it("Should handle complete token lifecycle", async function () {
            // 1. Initial token distribution
            expect(await testToken.balanceOf(owner.address)).to.equal(TOTAL_SUPPLY);
            expect(await testToken.totalSupply()).to.equal(TOTAL_SUPPLY);

            // 2. Create vesting schedules for different categories
            await vesting.createVestingSchedule(
                addr1.address,
                VESTING_AMOUNT,
                10, // 10% TGE
                0, // No cliff
                12 * MONTH_IN_SECONDS, // 12 months vesting
                "Community"
            );

            await vesting.createVestingSchedule(
                addr2.address,
                VESTING_AMOUNT,
                0, // No TGE
                6 * MONTH_IN_SECONDS, // 6 months cliff
                36 * MONTH_IN_SECONDS, // 36 months vesting
                "Team"
            );

            // 3. Users stake tokens
            await testToken.transfer(addr1.address, STAKE_AMOUNT);
            await testToken.connect(addr1).approve(await staking.getAddress(), STAKE_AMOUNT);
            await staking.connect(addr1).stake(STAKE_AMOUNT, 30 * 24 * 60 * 60);

            await testToken.transfer(addr2.address, STAKE_AMOUNT);
            await testToken.connect(addr2).approve(await staking.getAddress(), STAKE_AMOUNT);
            await staking.connect(addr2).stake(STAKE_AMOUNT, 60 * 24 * 60 * 60);

            // 4. Create governance proposal
            await governance.propose("Ecosystem integration test proposal");

            // 5. Vote on proposal
            await time.increase(24 * 60 * 60 + 1); // Fast forward past voting delay
            await governance.vote(0, true);

            // 6. Execute proposal
            await time.increase(3 * 24 * 60 * 60 + 1); // Fast forward past voting period
            await governance.execute(0);

            // 7. Release vested tokens
            await time.increase(6 * MONTH_IN_SECONDS + 1); // Fast forward 6 months
            await vesting.connect(addr1).release();
            await vesting.connect(addr2).release();

            // 8. Unstake tokens
            await time.increase(30 * 24 * 60 * 60 + 1); // Fast forward 30 days
            await testToken.mint(await staking.getAddress(), ethers.parseEther("1000"), "Rewards");
            await staking.connect(addr1).unstake();
            await staking.connect(addr2).unstake();

            // Verify final states
            expect(await vesting.getTotalReleased()).to.be.greaterThan(0);
            expect(await governance.getProposalCount()).to.equal(1);
            expect(await staking.getPoolInfo()).to.not.be.undefined;
        });

        it("Should handle multiple users and complex interactions", async function () {
            // Setup multiple users with different roles
            const users = [addr1, addr2, addr3];
            const amounts = [
                ethers.parseEther("5000"),
                ethers.parseEther("10000"),
                ethers.parseEther("15000")
            ];

            // Transfer tokens to users
            for (let i = 0; i < users.length; i++) {
                await testToken.transfer(users[i].address, amounts[i]);
            }

            // Users stake different amounts
            for (let i = 0; i < users.length; i++) {
                await testToken.connect(users[i]).approve(await staking.getAddress(), amounts[i]);
                await staking.connect(users[i]).stake(amounts[i], (30 + i * 30) * 24 * 60 * 60);
            }

            // Create multiple governance proposals
            await governance.propose("First proposal");
            await governance.propose("Second proposal");
            await governance.propose("Third proposal");

            // Users vote on proposals
            await time.increase(24 * 60 * 60 + 1);
            for (let i = 0; i < users.length; i++) {
                await governance.connect(users[i]).vote(i, i % 2 === 0); // Alternate votes
            }

            // Fast forward and execute proposals
            await time.increase(3 * 24 * 60 * 60 + 1);
            for (let i = 0; i < 3; i++) {
                await governance.execute(i);
            }

            // Verify all interactions worked
            expect(await governance.getProposalCount()).to.equal(3);
            expect(await staking.getPoolInfo()).to.not.be.undefined;
        });
    });

    describe("Vesting and Staking Integration", function () {
        it("Should allow staking of vested tokens", async function () {
            // Create vesting schedule
            await vesting.createVestingSchedule(
                addr1.address,
                VESTING_AMOUNT,
                20, // 20% TGE
                0, // No cliff
                12 * MONTH_IN_SECONDS, // 12 months vesting
                "Community"
            );

            // User receives TGE tokens
            const tgeAmount = VESTING_AMOUNT * 20n / 100n;
            expect(await testToken.balanceOf(addr1.address)).to.equal(tgeAmount);

            // User stakes TGE tokens
            await testToken.connect(addr1).approve(await staking.getAddress(), tgeAmount);
            await staking.connect(addr1).stake(tgeAmount, 30 * 24 * 60 * 60);

            // Verify staking worked
            const stakeInfo = await staking.getStakeInfo(addr1.address);
            expect(stakeInfo.amount).to.equal(tgeAmount);
            expect(stakeInfo.active).to.be.true;
        });

        it("Should handle vesting release and immediate staking", async function () {
            // Create vesting schedule
            await vesting.createVestingSchedule(
                addr1.address,
                VESTING_AMOUNT,
                0, // No TGE
                0, // No cliff
                12 * MONTH_IN_SECONDS, // 12 months vesting
                "Community"
            );

            // Fast forward 6 months
            await time.increase(6 * MONTH_IN_SECONDS);

            // Release vested tokens
            await vesting.connect(addr1).release();
            const releasedAmount = await testToken.balanceOf(addr1.address);

            // Immediately stake released tokens
            await testToken.connect(addr1).approve(await staking.getAddress(), releasedAmount);
            await staking.connect(addr1).stake(releasedAmount, 30 * 24 * 60 * 60);

            // Verify staking worked
            const stakeInfo = await staking.getStakeInfo(addr1.address);
            expect(stakeInfo.amount).to.equal(releasedAmount);
        });
    });

    describe("Governance and Staking Integration", function () {
        it("Should allow stakers to participate in governance", async function () {
            // Users stake tokens
            await testToken.transfer(addr1.address, STAKE_AMOUNT);
            await testToken.connect(addr1).approve(await staking.getAddress(), STAKE_AMOUNT);
            await staking.connect(addr1).stake(STAKE_AMOUNT, 30 * 24 * 60 * 60);

            await testToken.transfer(addr2.address, STAKE_AMOUNT);
            await testToken.connect(addr2).approve(await staking.getAddress(), STAKE_AMOUNT);
            await staking.connect(addr2).stake(STAKE_AMOUNT, 30 * 24 * 60 * 60);

            // Create governance proposal
            await governance.propose("Staker governance test");

            // Stakers vote
            await time.increase(24 * 60 * 60 + 1);
            await governance.connect(addr1).vote(0, true);
            await governance.connect(addr2).vote(0, false);

            // Execute proposal
            await time.increase(3 * 24 * 60 * 60 + 1);
            await governance.execute(0);

            // Verify governance worked
            expect(await governance.getProposalCount()).to.equal(1);
        });

        it("Should handle governance proposals affecting staking parameters", async function () {
            // Create proposal to change staking reward rate
            await governance.propose("Change staking reward rate to 15%");

            // Vote and execute
            await time.increase(24 * 60 * 60 + 1);
            await governance.vote(0, true);
            await time.increase(3 * 24 * 60 * 60 + 1);
            await governance.execute(0);

            // Admin changes staking parameters (simulating governance decision)
            await staking.setRewardRate(15);

            // Verify change
            const poolInfo = await staking.getPoolInfo();
            expect(poolInfo.rewardRate).to.equal(15);
        });
    });

    describe("Buyback and Ecosystem Integration", function () {
        it("Should handle buyback affecting token supply", async function () {
            // Transfer tokens to buyback contract for burning
            await testToken.transfer(await buybackBurn.getAddress(), ethers.parseEther("1000"));

            // Execute burn
            await buybackBurn.executeBurn(ethers.parseEther("1000"));

            // Verify burn worked
            expect(await buybackBurn.getTotalBurned()).to.equal(ethers.parseEther("1000"));
            expect(await testToken.balanceOf(await buybackBurn.getAddress())).to.equal(0);
        });

        it("Should handle ecosystem with buyback and staking", async function () {
            // Users stake tokens
            await testToken.transfer(addr1.address, STAKE_AMOUNT);
            await testToken.connect(addr1).approve(await staking.getAddress(), STAKE_AMOUNT);
            await staking.connect(addr1).stake(STAKE_AMOUNT, 30 * 24 * 60 * 60);

            // Transfer tokens for buyback
            await testToken.transfer(await buybackBurn.getAddress(), ethers.parseEther("500"));

            // Execute burn
            await buybackBurn.executeBurn(ethers.parseEther("500"));

            // Fast forward and unstake
            await time.increase(30 * 24 * 60 * 60 + 1);
            await testToken.mint(await staking.getAddress(), ethers.parseEther("1000"), "Rewards");
            await staking.connect(addr1).unstake();

            // Verify both systems worked
            expect(await buybackBurn.getTotalBurned()).to.equal(ethers.parseEther("500"));
            expect(await testToken.balanceOf(addr1.address)).to.be.greaterThan(STAKE_AMOUNT);
        });
    });

    describe("Error Handling and Edge Cases", function () {
        it("Should handle insufficient balance scenarios", async function () {
            // Try to stake more than balance
            await testToken.transfer(addr1.address, ethers.parseEther("100"));
            await testToken.connect(addr1).approve(await staking.getAddress(), ethers.parseEther("1000"));
            
            await expect(staking.connect(addr1).stake(ethers.parseEther("1000"), 30 * 24 * 60 * 60))
                .to.be.revertedWith("ERC20: transfer amount exceeds balance");
        });

        it("Should handle expired vesting schedules", async function () {
            // Create vesting schedule
            await vesting.createVestingSchedule(
                addr1.address,
                VESTING_AMOUNT,
                0, // No TGE
                0, // No cliff
                12 * MONTH_IN_SECONDS, // 12 months vesting
                "Community"
            );

            // Fast forward past vesting period
            await time.increase(12 * MONTH_IN_SECONDS + 1);

            // Release all tokens
            await vesting.connect(addr1).release();
            const releasedAmount = await testToken.balanceOf(addr1.address);
            expect(releasedAmount).to.equal(VESTING_AMOUNT);
        });

        it("Should handle governance proposal failures", async function () {
            // Create proposal
            await governance.propose("Test proposal");

            // Try to execute before voting ends
            await time.increase(24 * 60 * 60 + 1);
            await expect(governance.execute(0))
                .to.be.revertedWith("Voting not ended");

            // Vote against
            await governance.vote(0, false);
            await time.increase(3 * 24 * 60 * 60 + 1);

            // Try to execute rejected proposal
            await expect(governance.execute(0))
                .to.be.revertedWith("Proposal rejected");
        });
    });

    describe("Performance and Gas Optimization", function () {
        it("Should handle multiple operations efficiently", async function () {
            const startGas = await ethers.provider.getBalance(owner.address);

            // Perform multiple operations
            for (let i = 0; i < 5; i++) {
                await testToken.mint(addr1.address, ethers.parseEther("1000"), `Mint ${i}`);
                await testToken.connect(addr1).approve(await staking.getAddress(), ethers.parseEther("1000"));
                await staking.connect(addr1).stake(ethers.parseEther("1000"), 30 * 24 * 60 * 60);
            }

            const endGas = await ethers.provider.getBalance(owner.address);
            const gasUsed = startGas - endGas;
            
            // Verify operations completed successfully
            expect(await testToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("5000"));
            expect(gasUsed).to.be.greaterThan(0);
        });

        it("Should handle large number of users", async function () {
            const userCount = 10;
            const users = addrs.slice(0, userCount);

            // Transfer tokens to all users
            for (let i = 0; i < userCount; i++) {
                await testToken.transfer(users[i].address, ethers.parseEther("1000"));
            }

            // All users stake
            for (let i = 0; i < userCount; i++) {
                await testToken.connect(users[i]).approve(await staking.getAddress(), ethers.parseEther("1000"));
                await staking.connect(users[i]).stake(ethers.parseEther("1000"), 30 * 24 * 60 * 60);
            }

            // Verify all stakes worked
            const poolInfo = await staking.getPoolInfo();
            expect(poolInfo.totalStaked).to.equal(ethers.parseEther("10000"));
        });
    });

    describe("Security and Access Control", function () {
        it("Should enforce proper access controls across contracts", async function () {
            // Try to mint without role
            await expect(testToken.connect(addr1).mint(addr2.address, ethers.parseEther("1000"), "Test"))
                .to.be.revertedWithCustomError(testToken, "Unauthorized");

            // Try to create vesting without role
            await expect(vesting.connect(addr1).createVestingSchedule(
                addr2.address,
                ethers.parseEther("1000"),
                0,
                0,
                12 * MONTH_IN_SECONDS,
                "Test"
            )).to.be.revertedWithCustomError(vesting, "Unauthorized");

            // Try to set staking parameters without role
            await expect(staking.connect(addr1).setRewardRate(15))
                .to.be.revertedWithCustomError(staking, "Unauthorized");

            // Try to execute buyback without role
            await expect(buybackBurn.connect(addr1).executeBuyback())
                .to.be.revertedWithCustomError(buybackBurn, "Unauthorized");
        });

        it("Should handle contract upgrades and role management", async function () {
            // Grant roles to new addresses
            await testToken.grantRole(await testToken.MINTER_ROLE(), addr1.address);
            await vesting.grantRole(await vesting.VESTING_MANAGER_ROLE(), addr1.address);
            await staking.grantRole(await staking.STAKING_MANAGER_ROLE(), addr1.address);

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

            // Verify actions worked
            expect(await testToken.balanceOf(addr2.address)).to.equal(ethers.parseEther("1000"));
            expect(await staking.getPoolInfo()).to.not.be.undefined;
        });
    });
});
