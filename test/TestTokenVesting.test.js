const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("TestTokenVesting - Unit Tests", function () {
    let testToken;
    let vesting;
    let owner;
    let addr1;
    let addr2;
    let addrs;

    const VESTING_AMOUNT = ethers.parseEther("100000"); // 100K THB
    const MONTH_IN_SECONDS = 30 * 24 * 60 * 60; // 30 days

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

        // Approve vesting contract
        await testToken.approve(await vesting.getAddress(), ethers.parseEther("1000000"));
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await vesting.hasRole(await vesting.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
        });

        it("Should set correct test token address", async function () {
            expect(await vesting.testToken()).to.equal(await testToken.getAddress());
        });

        it("Should initialize with zero totals", async function () {
            expect(await vesting.getTotalVested()).to.equal(0);
            expect(await vesting.getTotalReleased()).to.equal(0);
        });
    });

    describe("Vesting Schedule Creation", function () {
        it("Should create vesting schedule correctly", async function () {
            await vesting.createVestingSchedule(
                addr1.address,
                VESTING_AMOUNT,
                10, // 10% TGE
                6 * MONTH_IN_SECONDS, // 6 months cliff
                36 * MONTH_IN_SECONDS, // 36 months vesting
                "Team"
            );

            const schedule = await vesting.getVestingSchedule(addr1.address);
            expect(schedule.totalAmount).to.equal(VESTING_AMOUNT);
            expect(schedule.tgePercentage).to.equal(10);
            expect(schedule.cliffDuration).to.equal(6 * MONTH_IN_SECONDS);
            expect(schedule.vestingDuration).to.equal(36 * MONTH_IN_SECONDS);
            expect(schedule.category).to.equal("Team");
            expect(schedule.revocable).to.be.true;
            expect(schedule.revoked).to.be.false;
        });

        it("Should emit VestingScheduleCreated event", async function () {
            await expect(vesting.createVestingSchedule(
                addr1.address,
                VESTING_AMOUNT,
                10,
                6 * MONTH_IN_SECONDS,
                36 * MONTH_IN_SECONDS,
                "Team"
            )).to.emit(vesting, "VestingScheduleCreated")
            .withArgs(
                addr1.address,
                VESTING_AMOUNT,
                10,
                6 * MONTH_IN_SECONDS,
                36 * MONTH_IN_SECONDS,
                "Team"
            );
        });

        it("Should not create vesting for zero address", async function () {
            await expect(vesting.createVestingSchedule(
                ethers.ZeroAddress,
                VESTING_AMOUNT,
                10,
                0,
                12 * MONTH_IN_SECONDS,
                "Test"
            )).to.be.revertedWithCustomError(vesting, "ZeroAddress");
        });

        it("Should not create vesting with zero amount", async function () {
            await expect(vesting.createVestingSchedule(
                addr1.address,
                0,
                10,
                0,
                12 * MONTH_IN_SECONDS,
                "Test"
            )).to.be.revertedWithCustomError(vesting, "ZeroAmount");
        });

        it("Should not create vesting with invalid TGE percentage", async function () {
            await expect(vesting.createVestingSchedule(
                addr1.address,
                VESTING_AMOUNT,
                101, // > 100%
                0,
                12 * MONTH_IN_SECONDS,
                "Test"
            )).to.be.revertedWith("Invalid TGE percentage");
        });

        it("Should not create duplicate vesting schedule", async function () {
            await vesting.createVestingSchedule(
                addr1.address,
                VESTING_AMOUNT,
                10,
                0,
                12 * MONTH_IN_SECONDS,
                "Test"
            );

            await expect(vesting.createVestingSchedule(
                addr1.address,
                VESTING_AMOUNT,
                10,
                0,
                12 * MONTH_IN_SECONDS,
                "Test"
            )).to.be.revertedWith("Vesting already exists");
        });

        it("Should only allow VESTING_MANAGER_ROLE to create schedule", async function () {
            await expect(vesting.connect(addr1).createVestingSchedule(
                addr2.address,
                VESTING_AMOUNT,
                10,
                0,
                12 * MONTH_IN_SECONDS,
                "Test"
            )).to.be.revertedWithCustomError(vesting, "Unauthorized");
        });
    });

    describe("TGE Release", function () {
        it("Should release TGE amount immediately", async function () {
            await vesting.createVestingSchedule(
                addr1.address,
                VESTING_AMOUNT,
                10, // 10% TGE
                0,
                12 * MONTH_IN_SECONDS,
                "Node OG"
            );

            const tgeAmount = VESTING_AMOUNT * 10n / 100n;
            expect(await testToken.balanceOf(addr1.address)).to.equal(tgeAmount);
        });

        it("Should not release TGE for zero percentage", async function () {
            await vesting.createVestingSchedule(
                addr1.address,
                VESTING_AMOUNT,
                0, // 0% TGE
                0,
                12 * MONTH_IN_SECONDS,
                "Team"
            );

            expect(await testToken.balanceOf(addr1.address)).to.equal(0);
        });

        it("Should emit TokensReleased event for TGE", async function () {
            await expect(vesting.createVestingSchedule(
                addr1.address,
                VESTING_AMOUNT,
                10,
                0,
                12 * MONTH_IN_SECONDS,
                "Test"
            )).to.emit(vesting, "TokensReleased")
            .withArgs(addr1.address, VESTING_AMOUNT * 10n / 100n);
        });
    });

    describe("Vesting Calculations", function () {
        beforeEach(async function () {
            await vesting.createVestingSchedule(
                addr1.address,
                VESTING_AMOUNT,
                0, // No TGE
                0, // No cliff
                12 * MONTH_IN_SECONDS, // 12 months vesting
                "Community"
            );
        });

        it("Should calculate vested amount correctly after 6 months", async function () {
            // Fast forward 6 months
            await time.increase(6 * MONTH_IN_SECONDS);
            
            const vestedAmount = await vesting.getVestedAmount(addr1.address);
            const expectedAmount = VESTING_AMOUNT / 2n; // 50% after 6 months
            
            expect(vestedAmount).to.be.closeTo(expectedAmount, ethers.parseEther("1000"));
        });

        it("Should calculate vested amount correctly after full period", async function () {
            // Fast forward 12 months
            await time.increase(12 * MONTH_IN_SECONDS);
            
            const vestedAmount = await vesting.getVestedAmount(addr1.address);
            expect(vestedAmount).to.equal(VESTING_AMOUNT);
        });

        it("Should return zero vested amount before vesting starts", async function () {
            const vestedAmount = await vesting.getVestedAmount(addr1.address);
            expect(vestedAmount).to.equal(0);
        });

        it("Should calculate releasable amount correctly", async function () {
            // Fast forward 6 months
            await time.increase(6 * MONTH_IN_SECONDS);
            
            const releasableAmount = await vesting.getReleasableAmount(addr1.address);
            const expectedAmount = VESTING_AMOUNT / 2n; // 50% after 6 months
            
            expect(releasableAmount).to.be.closeTo(expectedAmount, ethers.parseEther("1000"));
        });

        it("Should return zero releasable amount when nothing to release", async function () {
            const releasableAmount = await vesting.getReleasableAmount(addr1.address);
            expect(releasableAmount).to.equal(0);
        });
    });

    describe("Cliff Period", function () {
        beforeEach(async function () {
            await vesting.createVestingSchedule(
                addr1.address,
                VESTING_AMOUNT,
                0, // No TGE
                6 * MONTH_IN_SECONDS, // 6 months cliff
                36 * MONTH_IN_SECONDS, // 36 months vesting
                "Team"
            );
        });

        it("Should return zero vested amount during cliff", async function () {
            // Fast forward 3 months (still in cliff)
            await time.increase(3 * MONTH_IN_SECONDS);
            
            const vestedAmount = await vesting.getVestedAmount(addr1.address);
            expect(vestedAmount).to.equal(0);
        });

        it("Should start vesting after cliff period", async function () {
            // Fast forward 6 months (end of cliff)
            await time.increase(6 * MONTH_IN_SECONDS);
            
            const vestedAmount = await vesting.getVestedAmount(addr1.address);
            expect(vestedAmount).to.equal(0); // Still 0 at exact cliff end
        });

        it("Should vest correctly after cliff period", async function () {
            // Fast forward 9 months (3 months after cliff)
            await time.increase(9 * MONTH_IN_SECONDS);
            
            const vestedAmount = await vesting.getVestedAmount(addr1.address);
            const expectedAmount = VESTING_AMOUNT * 3n / 36n; // 3/36 of total
            
            expect(vestedAmount).to.be.closeTo(expectedAmount, ethers.parseEther("1000"));
        });
    });

    describe("Token Release", function () {
        beforeEach(async function () {
            await vesting.createVestingSchedule(
                addr1.address,
                VESTING_AMOUNT,
                0, // No TGE
                0, // No cliff
                12 * MONTH_IN_SECONDS, // 12 months vesting
                "Community"
            );
        });

        it("Should release tokens correctly", async function () {
            // Fast forward 6 months
            await time.increase(6 * MONTH_IN_SECONDS);
            
            const balanceBefore = await testToken.balanceOf(addr1.address);
            await vesting.connect(addr1).release();
            const balanceAfter = await testToken.balanceOf(addr1.address);
            
            expect(balanceAfter).to.be.greaterThan(balanceBefore);
        });

        it("Should emit TokensReleased event", async function () {
            // Fast forward 6 months
            await time.increase(6 * MONTH_IN_SECONDS);
            
            const releasableAmount = await vesting.getReleasableAmount(addr1.address);
            await expect(vesting.connect(addr1).release())
                .to.emit(vesting, "TokensReleased")
                .withArgs(addr1.address, releasableAmount);
        });

        it("Should not release when nothing to release", async function () {
            await expect(vesting.connect(addr1).release())
                .to.be.revertedWith("No tokens to release");
        });

        it("Should allow admin to release for beneficiary", async function () {
            // Fast forward 6 months
            await time.increase(6 * MONTH_IN_SECONDS);
            
            const balanceBefore = await testToken.balanceOf(addr1.address);
            await vesting.releaseFor(addr1.address);
            const balanceAfter = await testToken.balanceOf(addr1.address);
            
            expect(balanceAfter).to.be.greaterThan(balanceBefore);
        });

        it("Should only allow VESTING_MANAGER_ROLE to release for others", async function () {
            await expect(vesting.connect(addr1).releaseFor(addr2.address))
                .to.be.revertedWithCustomError(vesting, "Unauthorized");
        });
    });

    describe("Vesting Revocation", function () {
        beforeEach(async function () {
            await vesting.createVestingSchedule(
                addr1.address,
                VESTING_AMOUNT,
                0, // No TGE
                0, // No cliff
                12 * MONTH_IN_SECONDS, // 12 months vesting
                "Test"
            );
        });

        it("Should revoke vesting correctly", async function () {
            await vesting.revokeVesting(addr1.address);
            
            const schedule = await vesting.getVestingSchedule(addr1.address);
            expect(schedule.revoked).to.be.true;
        });

        it("Should emit VestingRevoked event", async function () {
            await expect(vesting.revokeVesting(addr1.address))
                .to.emit(vesting, "VestingRevoked")
                .withArgs(addr1.address, VESTING_AMOUNT);
        });

        it("Should not revoke non-existent vesting", async function () {
            await expect(vesting.revokeVesting(addr2.address))
                .to.be.revertedWith("No vesting schedule");
        });

        it("Should not revoke already revoked vesting", async function () {
            await vesting.revokeVesting(addr1.address);
            await expect(vesting.revokeVesting(addr1.address))
                .to.be.revertedWith("Already revoked");
        });

        it("Should not release from revoked vesting", async function () {
            await vesting.revokeVesting(addr1.address);
            await time.increase(6 * MONTH_IN_SECONDS);
            
            await expect(vesting.connect(addr1).release())
                .to.be.revertedWith("Vesting revoked");
        });
    });

    describe("Category Management", function () {
        it("Should track category allocations correctly", async function () {
            await vesting.createVestingSchedule(
                addr1.address,
                VESTING_AMOUNT,
                0,
                0,
                12 * MONTH_IN_SECONDS,
                "Team"
            );

            await vesting.createVestingSchedule(
                addr2.address,
                VESTING_AMOUNT,
                0,
                0,
                12 * MONTH_IN_SECONDS,
                "Team"
            );

            const teamAllocation = await vesting.getCategoryAllocation("Team");
            expect(teamAllocation).to.equal(VESTING_AMOUNT * 2n);
        });

        it("Should return zero for non-existent category", async function () {
            const allocation = await vesting.getCategoryAllocation("NonExistent");
            expect(allocation).to.equal(0);
        });
    });

    describe("View Functions", function () {
        beforeEach(async function () {
            await vesting.createVestingSchedule(
                addr1.address,
                VESTING_AMOUNT,
                10, // 10% TGE
                0,
                12 * MONTH_IN_SECONDS,
                "Test"
            );
        });

        it("Should return correct vesting schedule", async function () {
            const schedule = await vesting.getVestingSchedule(addr1.address);
            expect(schedule.totalAmount).to.equal(VESTING_AMOUNT);
            expect(schedule.tgePercentage).to.equal(10);
            expect(schedule.category).to.equal("Test");
        });

        it("Should return zero for non-existent schedule", async function () {
            const schedule = await vesting.getVestingSchedule(addr2.address);
            expect(schedule.totalAmount).to.equal(0);
        });

        it("Should return correct beneficiary count", async function () {
            expect(await vesting.getBeneficiaryCount()).to.equal(1);
        });

        it("Should update totals correctly", async function () {
            expect(await vesting.getTotalVested()).to.equal(VESTING_AMOUNT);
            expect(await vesting.getTotalReleased()).to.equal(VESTING_AMOUNT * 10n / 100n);
        });
    });

    describe("Edge Cases", function () {
        it("Should handle very small vesting amounts", async function () {
            const smallAmount = ethers.parseEther("1");
            await vesting.createVestingSchedule(
                addr1.address,
                smallAmount,
                0,
                0,
                12 * MONTH_IN_SECONDS,
                "Test"
            );

            const schedule = await vesting.getVestingSchedule(addr1.address);
            expect(schedule.totalAmount).to.equal(smallAmount);
        });

        it("Should handle very long vesting periods", async function () {
            const longPeriod = 10 * 365 * 24 * 60 * 60; // 10 years
            await vesting.createVestingSchedule(
                addr1.address,
                VESTING_AMOUNT,
                0,
                0,
                longPeriod,
                "Test"
            );

            const schedule = await vesting.getVestingSchedule(addr1.address);
            expect(schedule.vestingDuration).to.equal(longPeriod);
        });

        it("Should handle 100% TGE", async function () {
            await vesting.createVestingSchedule(
                addr1.address,
                VESTING_AMOUNT,
                100, // 100% TGE
                0,
                12 * MONTH_IN_SECONDS,
                "Test"
            );

            expect(await testToken.balanceOf(addr1.address)).to.equal(VESTING_AMOUNT);
        });
    });
});
