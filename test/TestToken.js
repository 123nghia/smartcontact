const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TestToken - Audit Ready Version", function () {
    let token, admin, user, bad, minter, pauser;

    beforeEach(async function () {
        [admin, user, bad, minter, pauser] = await ethers.getSigners();
        
        const Token = await ethers.getContractFactory("TestToken");
        token = await Token.deploy(admin.address);
        // ethers v6: không cần .deployed() nữa
        await token.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set correct name, symbol, and cap", async function () {
            expect(await token.name()).to.equal("test");
            expect(await token.symbol()).to.equal("TEST");
            expect(await token.cap()).to.equal(ethers.parseUnits("1000000000", 18));
        });

        it("Should assign all roles to admin", async function () {
            const DEFAULT_ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
            const MINTER_ROLE = await token.MINTER_ROLE();
            const PAUSER_ROLE = await token.PAUSER_ROLE();
            const BLACKLISTER_ROLE = await token.BLACKLISTER_ROLE();

            expect(await token.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
            expect(await token.hasRole(MINTER_ROLE, admin.address)).to.be.true;
            expect(await token.hasRole(PAUSER_ROLE, admin.address)).to.be.true;
            expect(await token.hasRole(BLACKLISTER_ROLE, admin.address)).to.be.true;
        });

        it("Should have correct admin count", async function () {
            expect(await token.getAdminCount()).to.equal(1);
        });

        it("Should revert if admin is zero address", async function () {
            const Token = await ethers.getContractFactory("TestToken");
            await expect(
                Token.deploy(ethers.ZeroAddress)
            ).to.be.revertedWith("Admin cannot be zero address");
        });
    });

    describe("Minting", function () {
        it("Should mint tokens successfully", async function () {
            const amount = ethers.parseUnits("100", 18);
            
            await expect(token.connect(admin).mint(user.address, amount))
                .to.emit(token, "Transfer")
                .withArgs(ethers.ZeroAddress, user.address, amount);

            expect(await token.balanceOf(user.address)).to.equal(amount);
            expect(await token.totalSupply()).to.equal(amount);
        });

        it("Should not exceed cap", async function () {
            const cap = await token.cap();
            
            // Mint gần đến cap
            const nearCap = cap - ethers.parseUnits("1", 18);
            await token.connect(admin).mint(admin.address, nearCap);
            
            // Mint vượt cap
            await expect(
                token.connect(admin).mint(admin.address, ethers.parseUnits("2", 18))
            ).to.be.revertedWith("ERC20Capped: cap exceeded");
        });

        it("Should revert if minter is not authorized", async function () {
            await expect(
                token.connect(user).mint(user.address, 100)
            ).to.be.reverted;
        });

        it("Should revert if minting to blacklisted address", async function () {
            await token.connect(admin).setBlacklisted(bad.address, true);
            
            await expect(
                token.connect(admin).mint(bad.address, 100)
            ).to.be.revertedWithCustomError(token, "BlacklistedRecipient");
        });

        it("Should revert if minting to zero address", async function () {
            await expect(
                token.connect(admin).mint(ethers.ZeroAddress, 100)
            ).to.be.revertedWithCustomError(token, "ZeroAddress");
        });
    });

    describe("Burning", function () {
        beforeEach(async function () {
            await token.connect(admin).mint(user.address, ethers.parseUnits("100", 18));
        });

        it("Should burn tokens successfully", async function () {
            const burnAmount = ethers.parseUnits("10", 18);
            const initialSupply = await token.totalSupply();

            await token.connect(user).burn(burnAmount);

            expect(await token.balanceOf(user.address)).to.equal(
                ethers.parseUnits("90", 18)
            );
            expect(await token.totalSupply()).to.equal(initialSupply - burnAmount);
        });

        it("Should revert burn if sender is blacklisted", async function () {
            await token.connect(admin).setBlacklisted(user.address, true);
            
            await expect(
                token.connect(user).burn(100)
            ).to.be.revertedWithCustomError(token, "BlacklistedOwner");
        });

        it("Should burnFrom successfully with allowance", async function () {
            await token.connect(user).approve(admin.address, ethers.parseUnits("50", 18));
            
            await token.connect(admin).burnFrom(user.address, ethers.parseUnits("20", 18));
            
            expect(await token.balanceOf(user.address)).to.equal(
                ethers.parseUnits("80", 18)
            );
        });

        it("Should revert burnFrom if account is blacklisted", async function () {
            await token.connect(user).approve(admin.address, ethers.parseUnits("50", 18));
            await token.connect(admin).setBlacklisted(user.address, true);
            
            await expect(
                token.connect(admin).burnFrom(user.address, 100)
            ).to.be.revertedWithCustomError(token, "BlacklistedOwner");
        });
    });

    describe("Pause/Unpause", function () {
        beforeEach(async function () {
            await token.connect(admin).mint(user.address, ethers.parseUnits("100", 18));
        });

        it("Should pause and unpause transfers", async function () {
            await token.connect(admin).pause();
            expect(await token.isPaused()).to.be.true;

            await expect(
                token.connect(user).transfer(admin.address, 100)
            ).to.be.revertedWith("Pausable: paused");

            await token.connect(admin).unpause();
            expect(await token.isPaused()).to.be.false;

            await expect(
                token.connect(user).transfer(admin.address, 100)
            ).to.emit(token, "Transfer");
        });

        it("Should revert pause if not pauser role", async function () {
            await expect(
                token.connect(user).pause()
            ).to.be.reverted;
        });

        it("Should prevent approve when paused", async function () {
            await token.connect(admin).pause();
            
            await expect(
                token.connect(user).approve(admin.address, 100)
            ).to.be.revertedWith("Pausable: paused");
        });

        it("Should prevent transfers when paused", async function () {
            await token.connect(admin).pause();
            
            await expect(
                token.connect(user).transfer(admin.address, 100)
            ).to.be.revertedWith("Pausable: paused");
        });
    });

    describe("Blacklist", function () {
        beforeEach(async function () {
            await token.connect(admin).mint(user.address, ethers.parseUnits("100", 18));
        });

        it("Should blacklist and whitelist accounts", async function () {
            await expect(token.connect(admin).setBlacklisted(bad.address, true))
                .to.emit(token, "Blacklisted")
                .withArgs(bad.address, true);

            expect(await token.isBlacklisted(bad.address)).to.be.true;

            await token.connect(admin).setBlacklisted(bad.address, false);
            expect(await token.isBlacklisted(bad.address)).to.be.false;
        });

        it("Should blacklist multiple accounts in batch", async function () {
            const accounts = [bad.address, minter.address, pauser.address];
            
            await token.connect(admin).setBlacklistedBatch(accounts, true);
            
            for (const account of accounts) {
                expect(await token.isBlacklisted(account)).to.be.true;
            }
        });

        it("Should prevent blacklisted sender from transferring", async function () {
            await token.connect(admin).setBlacklisted(user.address, true);
            
            await expect(
                token.connect(user).transfer(admin.address, 100)
            ).to.be.revertedWithCustomError(token, "BlacklistedSender");
        });

        it("Should prevent transfer to blacklisted recipient", async function () {
            await token.connect(admin).setBlacklisted(bad.address, true);
            
            await expect(
                token.connect(user).transfer(bad.address, 100)
            ).to.be.revertedWithCustomError(token, "BlacklistedRecipient");
        });

        it("Should prevent blacklisted from approving", async function () {
            await token.connect(admin).setBlacklisted(user.address, true);
            
            await expect(
                token.connect(user).approve(admin.address, 100)
            ).to.be.revertedWithCustomError(token, "BlacklistedOwner");
        });

        it("Should prevent approval to blacklisted spender", async function () {
            await token.connect(admin).setBlacklisted(bad.address, true);
            
            await expect(
                token.connect(user).approve(bad.address, 100)
            ).to.be.revertedWithCustomError(token, "BlacklistedRecipient");
        });

        it("Should revert if blacklisting zero address", async function () {
            await expect(
                token.connect(admin).setBlacklisted(ethers.ZeroAddress, true)
            ).to.be.revertedWithCustomError(token, "ZeroAddress");
        });

        it("Should prevent increaseAllowance to blacklisted spender", async function () {
            await token.connect(admin).setBlacklisted(bad.address, true);
            
            await expect(
                token.connect(user).increaseAllowance(bad.address, 100)
            ).to.be.revertedWithCustomError(token, "BlacklistedRecipient");
        });

        it("Should prevent blacklisted owner from increaseAllowance", async function () {
            await token.connect(admin).setBlacklisted(user.address, true);
            
            await expect(
                token.connect(user).increaseAllowance(admin.address, 100)
            ).to.be.revertedWithCustomError(token, "BlacklistedOwner");
        });
    });

    describe("Access Control", function () {
        it("Should grant and revoke roles", async function () {
            const MINTER_ROLE = await token.MINTER_ROLE();
            
            await token.connect(admin).grantRole(MINTER_ROLE, minter.address);
            expect(await token.hasRole(MINTER_ROLE, minter.address)).to.be.true;

            await token.connect(admin).revokeRole(MINTER_ROLE, minter.address);
            expect(await token.hasRole(MINTER_ROLE, minter.address)).to.be.false;
        });

        it("Should prevent renouncing last admin role", async function () {
            const DEFAULT_ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
            
            await expect(
                token.connect(admin).renounceRole(DEFAULT_ADMIN_ROLE, admin.address)
            ).to.be.revertedWithCustomError(token, "CannotRenounceLastAdmin");
        });

        it("Should allow renouncing if there are multiple admins", async function () {
            const DEFAULT_ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
            
            // Grant admin to another account
            await token.connect(admin).grantRole(DEFAULT_ADMIN_ROLE, user.address);
            expect(await token.getAdminCount()).to.equal(2);
            
            // Now admin can renounce
            await token.connect(admin).renounceRole(DEFAULT_ADMIN_ROLE, admin.address);
            expect(await token.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.false;
            expect(await token.getAdminCount()).to.equal(1);
        });

        it("Should prevent revoking last admin", async function () {
            const DEFAULT_ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
            
            await expect(
                token.connect(admin).revokeRole(DEFAULT_ADMIN_ROLE, admin.address)
            ).to.be.revertedWithCustomError(token, "CannotRenounceLastAdmin");
        });

        it("Should track admin count correctly", async function () {
            const DEFAULT_ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
            
            expect(await token.getAdminCount()).to.equal(1);
            
            await token.connect(admin).grantRole(DEFAULT_ADMIN_ROLE, user.address);
            expect(await token.getAdminCount()).to.equal(2);
            
            await token.connect(admin).grantRole(DEFAULT_ADMIN_ROLE, minter.address);
            expect(await token.getAdminCount()).to.equal(3);
            
            await token.connect(admin).revokeRole(DEFAULT_ADMIN_ROLE, minter.address);
            expect(await token.getAdminCount()).to.equal(2);
        });

        it("Should check if address has any role", async function () {
            expect(await token.hasAnyRole(admin.address)).to.be.true;
            expect(await token.hasAnyRole(user.address)).to.be.false;
            
            const MINTER_ROLE = await token.MINTER_ROLE();
            await token.connect(admin).grantRole(MINTER_ROLE, user.address);
            expect(await token.hasAnyRole(user.address)).to.be.true;
        });
    });

    describe("Emergency Functions", function () {
        it("Should emergency withdraw ERC20 tokens", async function () {
            // Deploy a mock ERC20 token
            const MockToken = await ethers.getContractFactory("TestToken");
            const mockToken = await MockToken.deploy(admin.address);
            await mockToken.waitForDeployment();

            const tokenAddress = await token.getAddress();
            const mockTokenAddress = await mockToken.getAddress();

            // Send some tokens to main contract
            await mockToken.connect(admin).mint(tokenAddress, ethers.parseUnits("100", 18));

            // Emergency withdraw
            await expect(
                token.connect(admin).emergencyWithdrawToken(
                    mockTokenAddress,
                    admin.address,
                    ethers.parseUnits("100", 18)
                )
            ).to.emit(token, "EmergencyWithdraw");

            expect(await mockToken.balanceOf(admin.address)).to.equal(
                ethers.parseUnits("100", 18)
            );
        });

        it("Should revert emergency withdraw of native token", async function () {
            const tokenAddress = await token.getAddress();
            
            await expect(
                token.connect(admin).emergencyWithdrawToken(
                    tokenAddress,
                    admin.address,
                    100
                )
            ).to.be.revertedWith("Cannot withdraw native token");
        });

        it("Should revert emergency withdraw if not admin", async function () {
            await expect(
                token.connect(user).emergencyWithdrawToken(
                    ethers.ZeroAddress,
                    user.address,
                    100
                )
            ).to.be.reverted;
        });
    });

    describe("View Functions", function () {
        it("Should return correct token info", async function () {
            const info = await token.getTokenInfo();
            
            expect(info.tokenName).to.equal("test");
            expect(info.tokenSymbol).to.equal("TEST");
            expect(info.tokenDecimals).to.equal(18);
            expect(info.tokenCap).to.equal(ethers.parseUnits("1000000000", 18));
        });

        it("Should check pause status", async function () {
            expect(await token.isPaused()).to.be.false;
            
            await token.connect(admin).pause();
            expect(await token.isPaused()).to.be.true;
            
            await token.connect(admin).unpause();
            expect(await token.isPaused()).to.be.false;
        });
    });

    describe("Edge Cases", function () {
        it("Should handle multiple role assignments correctly", async function () {
            const MINTER_ROLE = await token.MINTER_ROLE();
            const PAUSER_ROLE = await token.PAUSER_ROLE();
            
            await token.connect(admin).grantRole(MINTER_ROLE, user.address);
            await token.connect(admin).grantRole(PAUSER_ROLE, user.address);
            
            expect(await token.hasRole(MINTER_ROLE, user.address)).to.be.true;
            expect(await token.hasRole(PAUSER_ROLE, user.address)).to.be.true;
        });

        it("Should handle batch blacklist with zero addresses", async function () {
            const accounts = [bad.address, ethers.ZeroAddress, minter.address];
            
            await token.connect(admin).setBlacklistedBatch(accounts, true);
            
            expect(await token.isBlacklisted(bad.address)).to.be.true;
            expect(await token.isBlacklisted(ethers.ZeroAddress)).to.be.false;
            expect(await token.isBlacklisted(minter.address)).to.be.true;
        });

        it("Should handle transferFrom when paused", async function () {
            await token.connect(admin).mint(user.address, ethers.parseUnits("100", 18));
            await token.connect(user).approve(admin.address, ethers.parseUnits("50", 18));
            
            await token.connect(admin).pause();
            
            await expect(
                token.connect(admin).transferFrom(user.address, minter.address, 100)
            ).to.be.revertedWith("Pausable: paused");
        });
    });
});