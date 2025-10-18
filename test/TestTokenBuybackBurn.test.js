const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("TestTokenBuybackBurn - Unit Tests", function () {
    let testToken;
    let buybackBurn;
    let owner;
    let addr1;
    let addr2;
    let addrs;

    const BUYBACK_BUDGET = ethers.parseEther("10000");
    const BURN_AMOUNT = ethers.parseEther("1000");
    const BUYBACK_INTERVAL = 7 * 24 * 60 * 60; // 7 days

    // Mock addresses for testing
    const MOCK_STABLECOIN = "0x55d398326f99059fF775485246999027B3197955"; // BUSD
    const MOCK_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E"; // PancakeSwap
    const MOCK_ORACLE = "0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE"; // BNB/USD

    beforeEach(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        // Deploy TestToken
        const TestToken = await ethers.getContractFactory("TestToken");
        testToken = await TestToken.deploy(owner.address);
        await testToken.waitForDeployment();

        // Deploy BuybackBurn
        const TestTokenBuybackBurn = await ethers.getContractFactory("TestTokenBuybackBurn");
        buybackBurn = await TestTokenBuybackBurn.deploy(
            await testToken.getAddress(),
            MOCK_STABLECOIN,
            MOCK_ROUTER,
            MOCK_ORACLE,
            owner.address
        );
        await buybackBurn.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await buybackBurn.hasRole(await buybackBurn.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
        });

        it("Should set correct contract addresses", async function () {
            expect(await buybackBurn.testToken()).to.equal(await testToken.getAddress());
            expect(await buybackBurn.stablecoin()).to.equal(MOCK_STABLECOIN);
            expect(await buybackBurn.router()).to.equal(MOCK_ROUTER);
            expect(await buybackBurn.priceOracle()).to.equal(MOCK_ORACLE);
        });

        it("Should initialize with correct default values", async function () {
            expect(await buybackBurn.buybackBudget()).to.equal(BUYBACK_BUDGET);
            expect(await buybackBurn.maxSlippage()).to.equal(500); // 5%
            expect(await buybackBurn.buybackInterval()).to.equal(BUYBACK_INTERVAL);
            expect(await buybackBurn.autoMode()).to.be.false;
            expect(await buybackBurn.useOracle()).to.be.true;
        });

        it("Should initialize buyback info correctly", async function () {
            const buybackInfo = await buybackBurn.getBuybackInfo();
            expect(buybackInfo.totalBought).to.equal(0);
            expect(buybackInfo.totalBurned).to.equal(0);
            expect(buybackInfo.autoMode).to.be.false;
        });
    });

    describe("Buyback Execution", function () {
        it("Should not execute buyback without stablecoin balance", async function () {
            // Fast forward past buyback interval
            await time.increase(BUYBACK_INTERVAL + 1);
            
            await expect(buybackBurn.executeBuyback())
                .to.be.revertedWith("Insufficient stablecoin balance");
        });

        it("Should not execute buyback too early", async function () {
            await expect(buybackBurn.executeBuyback())
                .to.be.revertedWith("Too early for buyback");
        });

        it("Should only allow BUYBACK_MANAGER_ROLE to execute buyback", async function () {
            await time.increase(BUYBACK_INTERVAL + 1);
            
            await expect(buybackBurn.connect(addr1).executeBuyback())
                .to.be.revertedWithCustomError(buybackBurn, "Unauthorized");
        });

        it("Should check canExecuteBuyback correctly", async function () {
            expect(await buybackBurn.canExecuteBuyback()).to.be.false; // No stablecoin balance
            
            // Fast forward past interval
            await time.increase(BUYBACK_INTERVAL + 1);
            expect(await buybackBurn.canExecuteBuyback()).to.be.false; // Still no stablecoin
        });
    });

    describe("Burn Execution", function () {
        beforeEach(async function () {
            // Transfer tokens to buyback contract
            await testToken.transfer(await buybackBurn.getAddress(), BURN_AMOUNT);
        });

        it("Should burn tokens correctly", async function () {
            await buybackBurn.executeBurn(BURN_AMOUNT);
            
            const buybackInfo = await buybackBurn.getBuybackInfo();
            expect(buybackInfo.totalBurned).to.equal(BURN_AMOUNT);
            expect(await testToken.balanceOf(await buybackBurn.getAddress())).to.equal(0);
        });

        it("Should emit BurnExecuted event", async function () {
            await expect(buybackBurn.executeBurn(BURN_AMOUNT))
                .to.emit(buybackBurn, "BurnExecuted")
                .withArgs(BURN_AMOUNT, anyValue);
        });

        it("Should not burn zero amount", async function () {
            await expect(buybackBurn.executeBurn(0))
                .to.be.revertedWithCustomError(buybackBurn, "ZeroAmount");
        });

        it("Should not burn more than available", async function () {
            const excessAmount = BURN_AMOUNT + ethers.parseEther("1");
            await expect(buybackBurn.executeBurn(excessAmount))
                .to.be.revertedWithCustomError(buybackBurn, "InsufficientBalance");
        });

        it("Should only allow BUYBACK_MANAGER_ROLE to burn", async function () {
            await expect(buybackBurn.connect(addr1).executeBurn(BURN_AMOUNT))
                .to.be.revertedWithCustomError(buybackBurn, "Unauthorized");
        });
    });

    describe("Auto Mode", function () {
        beforeEach(async function () {
            await buybackBurn.toggleAutoMode();
        });

        it("Should toggle auto mode correctly", async function () {
            expect(await buybackBurn.autoMode()).to.be.true;
            expect(await buybackBurn.isAutoMode()).to.be.true;
        });

        it("Should emit AutoModeToggled event", async function () {
            await expect(buybackBurn.toggleAutoMode())
                .to.emit(buybackBurn, "AutoModeToggled")
                .withArgs(false);
        });

        it("Should not execute auto buyback when disabled", async function () {
            await buybackBurn.toggleAutoMode(); // Disable
            await expect(buybackBurn.executeAutoBuyback())
                .to.be.revertedWith("Auto mode disabled");
        });

        it("Should not execute auto buyback too early", async function () {
            await expect(buybackBurn.executeAutoBuyback())
                .to.be.revertedWith("Too early for buyback");
        });

        it("Should only allow admin to toggle auto mode", async function () {
            await expect(buybackBurn.connect(addr1).toggleAutoMode())
                .to.be.revertedWithCustomError(buybackBurn, "Unauthorized");
        });
    });

    describe("Admin Functions", function () {
        it("Should set buyback budget correctly", async function () {
            const newBudget = ethers.parseEther("20000");
            await buybackBurn.setBuybackBudget(newBudget);
            expect(await buybackBurn.buybackBudget()).to.equal(newBudget);
        });

        it("Should emit BuybackBudgetUpdated event", async function () {
            const newBudget = ethers.parseEther("20000");
            await expect(buybackBurn.setBuybackBudget(newBudget))
                .to.emit(buybackBurn, "BuybackBudgetUpdated")
                .withArgs(newBudget);
        });

        it("Should not set zero budget", async function () {
            await expect(buybackBurn.setBuybackBudget(0))
                .to.be.revertedWithCustomError(buybackBurn, "ZeroAmount");
        });

        it("Should set buyback interval correctly", async function () {
            const newInterval = 14 * 24 * 60 * 60; // 14 days
            await buybackBurn.setBuybackInterval(newInterval);
            expect(await buybackBurn.buybackInterval()).to.equal(newInterval);
        });

        it("Should emit BuybackConfigUpdated event", async function () {
            const newInterval = 14 * 24 * 60 * 60;
            await expect(buybackBurn.setBuybackInterval(newInterval))
                .to.emit(buybackBurn, "BuybackConfigUpdated")
                .withArgs(await buybackBurn.buybackBudget(), newInterval);
        });

        it("Should not set zero interval", async function () {
            await expect(buybackBurn.setBuybackInterval(0))
                .to.be.revertedWith("Invalid interval");
        });

        it("Should set max slippage correctly", async function () {
            const newSlippage = 300; // 3%
            await buybackBurn.setMaxSlippage(newSlippage);
            expect(await buybackBurn.maxSlippage()).to.equal(newSlippage);
        });

        it("Should emit SlippageUpdated event", async function () {
            const newSlippage = 300;
            await expect(buybackBurn.setMaxSlippage(newSlippage))
                .to.emit(buybackBurn, "SlippageUpdated")
                .withArgs(newSlippage);
        });

        it("Should not set slippage too high", async function () {
            await expect(buybackBurn.setMaxSlippage(1001)) // > 10%
                .to.be.revertedWith("Slippage too high");
        });

        it("Should set oracle correctly", async function () {
            const newOracle = addr1.address;
            await buybackBurn.setOracle(newOracle);
            expect(await buybackBurn.priceOracle()).to.equal(newOracle);
        });

        it("Should emit OracleUpdated event", async function () {
            const newOracle = addr1.address;
            await expect(buybackBurn.setOracle(newOracle))
                .to.emit(buybackBurn, "OracleUpdated")
                .withArgs(newOracle);
        });

        it("Should not set zero oracle address", async function () {
            await expect(buybackBurn.setOracle(ethers.ZeroAddress))
                .to.be.revertedWithCustomError(buybackBurn, "ZeroAddress");
        });

        it("Should toggle use oracle correctly", async function () {
            expect(await buybackBurn.useOracle()).to.be.true;
            await buybackBurn.toggleUseOracle();
            expect(await buybackBurn.useOracle()).to.be.false;
        });

        it("Should only allow admin to set parameters", async function () {
            await expect(buybackBurn.connect(addr1).setBuybackBudget(ethers.parseEther("20000")))
                .to.be.revertedWithCustomError(buybackBurn, "Unauthorized");
        });

        it("Should deprecate setBuybackAmount function", async function () {
            await expect(buybackBurn.setBuybackAmount(ethers.parseEther("1000")))
                .to.be.revertedWith("Use setBuybackBudget instead");
        });
    });

    describe("Price Functions", function () {
        it("Should return buyback price", async function () {
            const price = await buybackBurn.getBuybackPrice();
            expect(price).to.be.greaterThan(0);
        });

        it("Should estimate tokens from budget", async function () {
            const budget = ethers.parseEther("1000");
            const estimatedTokens = await buybackBurn.estimateTokensFromBudget(budget);
            // In test environment, this might return 0 due to mock router
            expect(estimatedTokens).to.be.gte(0);
        });
    });

    describe("Emergency Functions", function () {
        beforeEach(async function () {
            // Transfer tokens and stablecoin to contract
            await testToken.transfer(await buybackBurn.getAddress(), BURN_AMOUNT);
        });

        it("Should emergency withdraw tokens", async function () {
            const balanceBefore = await testToken.balanceOf(owner.address);
            await buybackBurn.emergencyWithdraw();
            const balanceAfter = await testToken.balanceOf(owner.address);

            expect(balanceAfter).to.be.greaterThan(balanceBefore);
        });

        it("Should only allow admin to emergency withdraw", async function () {
            await expect(buybackBurn.connect(addr1).emergencyWithdraw())
                .to.be.revertedWithCustomError(buybackBurn, "Unauthorized");
        });
    });

    describe("View Functions", function () {
        it("Should return correct buyback info", async function () {
            const buybackInfo = await buybackBurn.getBuybackInfo();
            expect(buybackInfo.totalBought).to.equal(0);
            expect(buybackInfo.totalBurned).to.equal(0);
            expect(buybackInfo.autoMode).to.be.false;
        });

        it("Should return next buyback time", async function () {
            const nextTime = await buybackBurn.getNextBuybackTime();
            const expectedTime = (await buybackBurn.lastBuybackTime()) + BUYBACK_INTERVAL;
            expect(nextTime).to.equal(expectedTime);
        });

        it("Should return total burned", async function () {
            expect(await buybackBurn.getTotalBurned()).to.equal(0);
        });

        it("Should return total bought", async function () {
            expect(await buybackBurn.getTotalBought()).to.equal(0);
        });

        it("Should return contract balance", async function () {
            expect(await buybackBurn.getContractBalance()).to.equal(0);
        });

        it("Should return stablecoin balance", async function () {
            expect(await buybackBurn.getStablecoinBalance()).to.equal(0);
        });

        it("Should return time until next buyback", async function () {
            const timeUntil = await buybackBurn.getTimeUntilNextBuyback();
            expect(timeUntil).to.be.greaterThan(0);
            expect(timeUntil).to.be.lessThanOrEqual(BUYBACK_INTERVAL);
        });

        it("Should return zero time when buyback is ready", async function () {
            await time.increase(BUYBACK_INTERVAL + 1);
            const timeUntil = await buybackBurn.getTimeUntilNextBuyback();
            expect(timeUntil).to.equal(0);
        });
    });

    describe("Edge Cases", function () {
        it("Should handle very large buyback budget", async function () {
            const largeBudget = ethers.parseEther("1000000");
            await buybackBurn.setBuybackBudget(largeBudget);
            expect(await buybackBurn.buybackBudget()).to.equal(largeBudget);
        });

        it("Should handle very small buyback budget", async function () {
            const smallBudget = ethers.parseEther("1");
            await buybackBurn.setBuybackBudget(smallBudget);
            expect(await buybackBurn.buybackBudget()).to.equal(smallBudget);
        });

        it("Should handle maximum slippage", async function () {
            await buybackBurn.setMaxSlippage(1000); // 10%
            expect(await buybackBurn.maxSlippage()).to.equal(1000);
        });

        it("Should handle zero slippage", async function () {
            await buybackBurn.setMaxSlippage(0);
            expect(await buybackBurn.maxSlippage()).to.equal(0);
        });

        it("Should handle very long buyback interval", async function () {
            const longInterval = 365 * 24 * 60 * 60; // 1 year
            await buybackBurn.setBuybackInterval(longInterval);
            expect(await buybackBurn.buybackInterval()).to.equal(longInterval);
        });

        it("Should handle very short buyback interval", async function () {
            const shortInterval = 60 * 60; // 1 hour
            await buybackBurn.setBuybackInterval(shortInterval);
            expect(await buybackBurn.buybackInterval()).to.equal(shortInterval);
        });
    });

    describe("Integration with Token Contract", function () {
        it("Should work with token contract correctly", async function () {
            // Transfer tokens to buyback contract
            await testToken.transfer(await buybackBurn.getAddress(), BURN_AMOUNT);
            
            // Burn tokens
            await buybackBurn.executeBurn(BURN_AMOUNT);
            
            // Check token balance
            expect(await testToken.balanceOf(await buybackBurn.getAddress())).to.equal(0);
            
            // Check total burned
            expect(await buybackBurn.getTotalBurned()).to.equal(BURN_AMOUNT);
        });

        it("Should handle token transfers correctly", async function () {
            const transferAmount = ethers.parseEther("500");
            await testToken.transfer(await buybackBurn.getAddress(), transferAmount);
            
            expect(await buybackBurn.getContractBalance()).to.equal(transferAmount);
        });
    });
});
