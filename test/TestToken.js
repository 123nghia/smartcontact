const { expect } = require("chai");
const { ethers } = require("hardhat");
const { parseUnits } = ethers.utils;

describe("TestToken (OpenZeppelin v4, Solidity 0.8.28)", function () {

  async function deployFixture() {
    const [admin, user, bad] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("TestToken");
    const token = await Token.deploy(admin.address);
    return { token, admin, user, bad };
  }

  it("should assign roles to admin on deploy", async function () {
    const { token, admin } = await deployFixture();

    expect(await token.hasRole(await token.DEFAULT_ADMIN_ROLE(), admin.address)).to.equal(true);
    expect(await token.hasRole(await token.MINTER_ROLE(), admin.address)).to.equal(true);
    expect(await token.hasRole(await token.PAUSER_ROLE(), admin.address)).to.equal(true);
    expect(await token.hasRole(await token.BLACKLISTER_ROLE(), admin.address)).to.equal(true);
  });

  it("should mint and burn correctly", async function () {
    const { token, admin, user } = await deployFixture();
    const amount = parseUnits("100", 18);

    await expect(token.connect(admin).mint(user.address, amount))
      .to.emit(token, "Transfer")
      .withArgs(ethers.constants.AddressZero, user.address, amount);

    expect(await token.totalSupply()).to.equal(amount);
    expect(await token.balanceOf(user.address)).to.equal(amount);

    await token.connect(user).burn(parseUnits("10", 18));
    expect(await token.totalSupply()).to.equal(parseUnits("90", 18));
  });

  it("should not exceed cap", async function () {
    const { token, admin } = await deployFixture();
    const cap = await token.cap();

    // mint trước 1 ít
    await token.connect(admin).mint(admin.address, parseUnits("1", 18));

    // mint vượt quá cap => phải revert
    await expect(
      token.connect(admin).mint(admin.address, cap)
    ).to.be.revertedWith("ERC20Capped: cap exceeded");
  });

  it("should pause and unpause transfers", async function () {
    const { token, admin, user } = await deployFixture();
    await token.connect(admin).mint(user.address, parseUnits("1", 18));

    await token.connect(admin).pause();
    await expect(token.connect(user).transfer(admin.address, 1)).to.be.revertedWith("Pausable: paused");

    await token.connect(admin).unpause();
    await expect(token.connect(user).transfer(admin.address, 1))
      .to.emit(token, "Transfer");
  });

  it("should block blacklisted accounts", async function () {
    const { token, admin, bad, user } = await deployFixture();
    await token.connect(admin).mint(user.address, parseUnits("10", 18));

    await token.connect(admin).setBlacklisted(bad.address, true);
    expect(await token.isBlacklisted(bad.address)).to.equal(true);

    await expect(token.connect(admin).mint(bad.address, 1))
      .to.be.revertedWith("Blacklist: recipient");
    await expect(token.connect(bad).approve(user.address, 1))
      .to.be.revertedWith("Blacklist: owner");
  });
});
