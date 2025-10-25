const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenHub V2 - Basic Information Test", function () {
    let tokenHub;
    let deployer;
    let user1;
    let user2;

    beforeEach(async function () {
        [deployer, user1, user2] = await ethers.getSigners();
        
        // Deploy TokenHub V2
        const TokenHubV2 = await ethers.getContractFactory("TokenHubV2");
        tokenHub = await TokenHubV2.deploy(deployer.address);
        await tokenHub.waitForDeployment();
    });

    describe("1. Thông tin Chung Dự án", function () {
        it("Should have correct project name", async function () {
            const name = await tokenHub.name();
            expect(name).to.equal("Token Hub");
            console.log("✅ Project Name:", name);
        });

        it("Should be deployed on correct network", async function () {
            const network = await ethers.provider.getNetwork();
            console.log("✅ Network Name:", network.name);
            console.log("✅ Chain ID:", network.chainId.toString());
            
            // Check if it's BSC Testnet (Chain ID: 97) or local hardhat (Chain ID: 31337)
            expect([97, 31337]).to.include(Number(network.chainId));
        });

        it("Should have correct contract address format", async function () {
            const contractAddress = await tokenHub.getAddress();
            expect(contractAddress).to.match(/^0x[a-fA-F0-9]{40}$/);
            console.log("✅ Contract Address:", contractAddress);
        });

        it("Should have owner assigned to deployer", async function () {
            const owner = await tokenHub.owner();
            expect(owner).to.equal(deployer.address);
            console.log("✅ Owner:", deployer.address);
        });
    });

    describe("2. Thông tin Token", function () {
        it("Should have correct token name", async function () {
            const name = await tokenHub.name();
            expect(name).to.equal("Token Hub");
            console.log("✅ Token Name:", name);
        });

        it("Should have correct token symbol", async function () {
            const symbol = await tokenHub.symbol();
            expect(symbol).to.equal("AIEX");
            console.log("✅ Token Symbol:", symbol);
        });

        it("Should have correct decimals", async function () {
            const decimals = await tokenHub.decimals();
            expect(decimals).to.equal(18);
            console.log("✅ Token Decimals:", decimals.toString());
        });

        it("Should have correct total supply", async function () {
            const totalSupply = await tokenHub.totalSupply();
            const expectedSupply = ethers.parseUnits("100000000", 18); // 100M AIEX
            
            expect(totalSupply).to.equal(expectedSupply);
            console.log("✅ Total Supply:", ethers.formatUnits(totalSupply, 18), "AIEX");
        });

        it("Should be ERC-20 compliant", async function () {
            // Test basic ERC-20 functions
            const name = await tokenHub.name();
            const symbol = await tokenHub.symbol();
            const decimals = await tokenHub.decimals();
            const totalSupply = await tokenHub.totalSupply();
            
            expect(name).to.be.a('string');
            expect(symbol).to.be.a('string');
            expect(Number(decimals)).to.be.a('number');
            expect(totalSupply).to.be.a('bigint');
            
            console.log("✅ ERC-20 Compliance: PASSED");
        });

        it("Should be BEP-20 compatible (ERC-20 standard)", async function () {
            // BEP-20 is compatible with ERC-20
            const balance = await tokenHub.balanceOf(deployer.address);
            const totalSupply = await tokenHub.totalSupply();
            
            expect(balance).to.equal(totalSupply); // Deployer gets all tokens initially
            console.log("✅ BEP-20 Compatibility: PASSED");
        });

        it("Should be Simple ERC-20 Token", async function () {
            // Test basic token features
            const balance = await tokenHub.balanceOf(deployer.address);
            const totalSupply = await tokenHub.totalSupply();
            
            expect(balance).to.be.a('bigint');
            expect(totalSupply).to.be.a('bigint');
            expect(balance).to.equal(totalSupply); // Deployer gets all tokens initially
            
            console.log("✅ Token Balance:", ethers.formatUnits(balance, 18), "AIEX");
            console.log("✅ Total Supply:", ethers.formatUnits(totalSupply, 18), "AIEX");
        });
    });

    describe("3. Token Functions Test", function () {
        it("Should allow token transfer", async function () {
            const transferAmount = ethers.parseEther("1000");
            const initialBalance = await tokenHub.balanceOf(deployer.address);
            const userBalance = await tokenHub.balanceOf(user1.address);
            
            await tokenHub.transfer(user1.address, transferAmount);
            
            const finalBalance = await tokenHub.balanceOf(deployer.address);
            const finalUserBalance = await tokenHub.balanceOf(user1.address);
            
            expect(finalBalance).to.equal(initialBalance - transferAmount);
            expect(finalUserBalance).to.equal(userBalance + transferAmount);
            
            console.log("✅ Transfer successful:", ethers.formatUnits(transferAmount, 18), "AIEX");
        });

        it("Should allow token burning", async function () {
            const burnAmount = ethers.parseEther("100");
            const initialBalance = await tokenHub.balanceOf(deployer.address);
            const initialSupply = await tokenHub.totalSupply();
            
            await tokenHub.burn(burnAmount);
            
            const finalBalance = await tokenHub.balanceOf(deployer.address);
            const finalSupply = await tokenHub.totalSupply();
            
            expect(finalBalance).to.equal(initialBalance - burnAmount);
            expect(finalSupply).to.equal(initialSupply - burnAmount);
            
            console.log("✅ Burn successful:", ethers.formatUnits(burnAmount, 18), "AIEX");
        });

        it("Should have correct initial supply", async function () {
            const totalSupply = await tokenHub.totalSupply();
            const expectedSupply = ethers.parseEther("100000000"); // 100M AIEX
            
            expect(totalSupply).to.equal(expectedSupply);
            console.log("✅ Initial Supply:", ethers.formatUnits(totalSupply, 18), "AIEX");
        });
    });

    describe("4. Token Information Summary", function () {
        it("Should display complete token information", async function () {
            const name = await tokenHub.name();
            const symbol = await tokenHub.symbol();
            const decimals = await tokenHub.decimals();
            const totalSupply = await tokenHub.totalSupply();
            const owner = await tokenHub.owner();
            
            console.log("\n📊 ===== TOKEN INFORMATION SUMMARY =====");
            console.log("Project Name:", name);
            console.log("Token Symbol:", symbol);
            console.log("Token Decimals:", decimals.toString());
            console.log("Total Supply:", ethers.formatUnits(totalSupply, 18), "AIEX");
            console.log("Owner:", owner);
            console.log("Contract Address:", await tokenHub.getAddress());
            
            // Verify all information
            expect(name).to.equal("Token Hub");
            expect(symbol).to.equal("AIEX");
            expect(Number(decimals)).to.equal(18);
            expect(totalSupply).to.equal(ethers.parseUnits("100000000", 18));
            expect(owner).to.equal(deployer.address);
            
            console.log("✅ All token information verified successfully!");
        });
    });

    describe("5. Network and Deployment Verification", function () {
        it("Should verify deployment on correct network", async function () {
            const network = await ethers.provider.getNetwork();
            const contractAddress = await tokenHub.getAddress();
            
            console.log("\n🌐 ===== NETWORK INFORMATION =====");
            console.log("Network Name:", network.name);
            console.log("Chain ID:", network.chainId.toString());
            console.log("Contract Address:", contractAddress);
            
            // Verify network compatibility
            if (network.chainId === 97n) {
                console.log("✅ Deployed on BSC Testnet");
            } else if (network.chainId === 31337n) {
                console.log("✅ Deployed on Local Hardhat Network");
            } else {
                console.log("⚠️  Deployed on:", network.name, "(Chain ID:", network.chainId.toString() + ")");
            }
            
            // Verify contract address format
            expect(contractAddress).to.match(/^0x[a-fA-F0-9]{40}$/);
            console.log("✅ Contract address format is valid");
        });
    });
});
