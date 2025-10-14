const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🚀 Deploying contracts with:", deployer.address);

  // ✅ Cú pháp Ethers v6
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Deployer balance:", hre.ethers.formatEther(balance), "ETH");

  // ✅ Deploy contract
  const Token = await hre.ethers.getContractFactory("TestToken");
  const token = await Token.deploy(deployer.address);
  await token.waitForDeployment(); // thay cho .deployed() trong v6

  console.log("✅ TestToken deployed at:", await token.getAddress());
}

main().catch((error) => {
  console.error("❌ Deploy failed:", error);
  process.exitCode = 1;
});
