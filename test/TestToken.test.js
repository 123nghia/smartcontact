const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("TestToken - Unit Tests", function () {
    let testToken;
    let owner;
    let addr1;
    let addr2;
    let addrs;

    const TOTAL_SUPPLY = ethers.parseEther("100000000"); // 100M THB
    const MAX_SUPPLY = ethers.parseEther("150000000"); // 150M THB
    const TEST_AMOUNT = ethers.parseEther("1000");

    beforeEach(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        const TestToken = await ethers.getContractFactory("TestToken");
        testToken = await TestToken.deploy(owner.address);
        await testToken.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await testToken.hasRole(await testToken.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
        });

        it("Should set the correct token info", async function () {
            const tokenInfo = await testToken.getTokenInfo();
            expect(tokenInfo.name).to.equal("Test Token");
            expect(tokenInfo.symbol).to.equal("THB");
            expect(tokenInfo.decimals).to.equal(18);
            expect(tokenInfo.totalSupply_).to.equal(TOTAL_SUPPLY);
            expect(tokenInfo.maxSupply_).to.equal(MAX_SUPPLY);
        });

        it("Should mint initial supply to owner", async function () {
            expect(await testToken.balanceOf(owner.address)).to.equal(TOTAL_SUPPLY);
        });

        it("Should set correct roles", async function () {
            expect(await testToken.hasRole(await testToken.MINTER_ROLE(), owner.address)).to.be.true;
            expect(await testToken.hasRole(await testToken.BURNER_ROLE(), owner.address)).to.be.true;
            expect(await testToken.hasRole(await testToken.PAUSER_ROLE(), owner.address)).to.be.true;
        });
    });

    describe("Minting", function () {
        it("Should mint tokens correctly", async function () {
            await testToken.mint(addr1.address, TEST_AMOUNT, "Test mint");
            expect(await testToken.balanceOf(addr1.address)).to.equal(TEST_AMOUNT);
        });

        it("Should emit TokensMinted event", async function () {
            await expect(testToken.mint(addr1.address, TEST_AMOUNT, "Test mint"))
                .to.emit(testToken, "TokensMinted")
                .withArgs(addr1.address, TEST_AMOUNT, "Test mint");
        });

        it("Should not mint to zero address", async function () {
            await expect(testToken.mint(ethers.ZeroAddress, TEST_AMOUNT, "Test"))
                .to.be.revertedWithCustomError(testToken, "ZeroAddress");
        });

        it("Should not mint zero amount", async function () {
            await expect(testToken.mint(addr1.address, 0, "Test"))
                .to.be.revertedWithCustomError(testToken, "ZeroAmount");
        });

        it("Should not mint to blacklisted address", async function () {
            await testToken.setBlacklisted(addr1.address, true);
            await expect(testToken.mint(addr1.address, TEST_AMOUNT, "Test"))
                .to.be.revertedWithCustomError(testToken, "Blacklisted");
        });

        it("Should not mint when minting disabled", async function () {
            await testToken.toggleMinting();
            await expect(testToken.mint(addr1.address, TEST_AMOUNT, "Test"))
                .to.be.revertedWithCustomError(testToken, "MintingDisabled");
        });

        it("Should not mint beyond max supply", async function () {
            const excessAmount = MAX_SUPPLY - TOTAL_SUPPLY + ethers.parseEther("1");
            await expect(testToken.mint(addr1.address, excessAmount, "Test"))
                .to.be.revertedWith("Exceeds max supply");
        });

        it("Should not mint without MINTER_ROLE", async function () {
            await expect(testToken.connect(addr1).mint(addr2.address, TEST_AMOUNT, "Test"))
                .to.be.reverted;
        });

        it("Should not mint when paused", async function () {
            await testToken.pause();
            await expect(testToken.mint(addr1.address, TEST_AMOUNT, "Test"))
                .to.be.reverted;
        });
    });

    describe("Burning", function () {
        beforeEach(async function () {
            await testToken.transfer(addr1.address, TEST_AMOUNT);
        });

        it("Should burn tokens correctly", async function () {
            await testToken.connect(addr1).burn(TEST_AMOUNT);
            expect(await testToken.balanceOf(addr1.address)).to.equal(0);
        });

        it("Should emit TokensBurned event", async function () {
            await expect(testToken.connect(addr1).burn(TEST_AMOUNT))
                .to.emit(testToken, "TokensBurned")
                .withArgs(addr1.address, TEST_AMOUNT, "User burn");
        });

        it("Should not burn when burning disabled", async function () {
            await testToken.toggleBurning();
            await expect(testToken.connect(addr1).burn(TEST_AMOUNT))
                .to.be.revertedWithCustomError(testToken, "BurningDisabled");
        });

        it("Should not burn from blacklisted address", async function () {
            await testToken.setBlacklisted(addr1.address, true);
            await expect(testToken.connect(addr1).burn(TEST_AMOUNT))
                .to.be.revertedWithCustomError(testToken, "Blacklisted");
        });

        it("Should burnFrom correctly", async function () {
            await testToken.connect(addr1).approve(owner.address, TEST_AMOUNT);
            await testToken.burnFrom(addr1.address, TEST_AMOUNT);
            expect(await testToken.balanceOf(addr1.address)).to.equal(0);
        });
    });

    describe("Transfers", function () {
        beforeEach(async function () {
            await testToken.transfer(addr1.address, TEST_AMOUNT);
        });

        it("Should transfer tokens correctly", async function () {
            await testToken.connect(addr1).transfer(addr2.address, TEST_AMOUNT);
            expect(await testToken.balanceOf(addr2.address)).to.equal(TEST_AMOUNT);
        });

        it("Should emit TokensTransferred event", async function () {
            await expect(testToken.connect(addr1).transfer(addr2.address, TEST_AMOUNT))
                .to.emit(testToken, "TokensTransferred")
                .withArgs(addr1.address, addr2.address, TEST_AMOUNT);
        });

        it("Should not transfer from blacklisted address", async function () {
            await testToken.setBlacklisted(addr1.address, true);
            await expect(testToken.connect(addr1).transfer(addr2.address, TEST_AMOUNT))
                .to.be.revertedWithCustomError(testToken, "Blacklisted");
        });

        it("Should not transfer to blacklisted address", async function () {
            await testToken.setBlacklisted(addr2.address, true);
            await expect(testToken.connect(addr1).transfer(addr2.address, TEST_AMOUNT))
                .to.be.revertedWithCustomError(testToken, "Blacklisted");
        });

        it("Should not transfer when paused", async function () {
            await testToken.pause();
            await expect(testToken.connect(addr1).transfer(addr2.address, TEST_AMOUNT))
                .to.be.reverted;
        });

        it("Should transferFrom correctly", async function () {
            await testToken.connect(addr1).approve(owner.address, TEST_AMOUNT);
            await testToken.transferFrom(addr1.address, addr2.address, TEST_AMOUNT);
            expect(await testToken.balanceOf(addr2.address)).to.equal(TEST_AMOUNT);
        });
    });

    describe("Blacklist Management", function () {
        it("Should set blacklist correctly", async function () {
            await testToken.setBlacklisted(addr1.address, true);
            expect(await testToken.blacklisted(addr1.address)).to.be.true;
        });

        it("Should not set blacklist for zero address", async function () {
            await expect(testToken.setBlacklisted(ethers.ZeroAddress, true))
                .to.be.revertedWithCustomError(testToken, "ZeroAddress");
        });

        it("Should only allow admin to set blacklist", async function () {
            await expect(testToken.connect(addr1).setBlacklisted(addr2.address, true))
                .to.be.reverted;
        });
    });

    describe("Fee Discount", function () {
        it("Should set fee discount correctly", async function () {
            await testToken.setFeeDiscount(addr1.address, 50);
            expect(await testToken.feeDiscount(addr1.address)).to.equal(50);
        });

        it("Should not set invalid discount", async function () {
            await expect(testToken.setFeeDiscount(addr1.address, 101))
                .to.be.revertedWith("Invalid discount");
        });

        it("Should only allow admin to set fee discount", async function () {
            await expect(testToken.connect(addr1).setFeeDiscount(addr2.address, 50))
                .to.be.reverted;
        });
    });

    describe("Pause/Unpause", function () {
        it("Should pause correctly", async function () {
            await testToken.pause();
            expect(await testToken.paused()).to.be.true;
        });

        it("Should unpause correctly", async function () {
            await testToken.pause();
            await testToken.unpause();
            expect(await testToken.paused()).to.be.false;
        });

        it("Should only allow PAUSER_ROLE to pause", async function () {
            await expect(testToken.connect(addr1).pause())
                .to.be.reverted;
        });
    });

    describe("Contract Management", function () {
        it("Should set vesting contract", async function () {
            await testToken.setVestingContract(addr1.address);
            expect(await testToken.vestingContract()).to.equal(addr1.address);
        });

        it("Should set staking contract", async function () {
            await testToken.setStakingContract(addr1.address);
            expect(await testToken.stakingContract()).to.equal(addr1.address);
        });

        it("Should set governance contract", async function () {
            await testToken.setGovernanceContract(addr1.address);
            expect(await testToken.governanceContract()).to.equal(addr1.address);
        });

        it("Should set buyback contract", async function () {
            await testToken.setBuybackContract(addr1.address);
            expect(await testToken.buybackContract()).to.equal(addr1.address);
        });

        it("Should only allow admin to set contracts", async function () {
            await expect(testToken.connect(addr1).setVestingContract(addr2.address))
                .to.be.reverted;
        });
    });

    describe("View Functions", function () {
        it("Should return correct token info", async function () {
            const tokenInfo = await testToken.getTokenInfo();
            expect(tokenInfo.name).to.equal("Test Token");
            expect(tokenInfo.symbol).to.equal("THB");
            expect(tokenInfo.decimals).to.equal(18);
            expect(tokenInfo.totalSupply_).to.equal(TOTAL_SUPPLY);
            expect(tokenInfo.maxSupply_).to.equal(MAX_SUPPLY);
            expect(tokenInfo.totalMinted_).to.equal(TOTAL_SUPPLY);
            expect(tokenInfo.totalBurned_).to.equal(0);
            expect(tokenInfo.mintingEnabled_).to.be.true;
            expect(tokenInfo.burningEnabled_).to.be.true;
        });

        it("Should return correct account info", async function () {
            await testToken.transfer(addr1.address, TEST_AMOUNT);
            await testToken.setFeeDiscount(addr1.address, 25);
            
            const accountInfo = await testToken.getAccountInfo(addr1.address);
            expect(accountInfo.balance).to.equal(TEST_AMOUNT);
            expect(accountInfo.feeDiscount_).to.equal(25);
            expect(accountInfo.isBlacklisted_).to.be.false;
        });
    });

    describe("Edge Cases", function () {
        it("Should handle maximum supply correctly", async function () {
            const maxMintable = MAX_SUPPLY - TOTAL_SUPPLY;
            await testToken.mint(addr1.address, maxMintable, "Max mint");
            expect(await testToken.totalSupply()).to.equal(MAX_SUPPLY);
        });

        it("Should handle zero transfers", async function () {
            await testToken.connect(addr1).transfer(addr2.address, 0);
            expect(await testToken.balanceOf(addr1.address)).to.equal(0);
            expect(await testToken.balanceOf(addr2.address)).to.equal(0);
        });

        it("Should handle self transfers", async function () {
            // First give addr1 some tokens
            await testToken.transfer(addr1.address, TEST_AMOUNT);
            await testToken.connect(addr1).transfer(addr1.address, TEST_AMOUNT);
            expect(await testToken.balanceOf(addr1.address)).to.equal(TEST_AMOUNT);
        });
    });
});
