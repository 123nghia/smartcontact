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

        it("Should have admin role assigned to deployer", async function () {
            const hasAdminRole = await tokenHub.hasRole(await tokenHub.DEFAULT_ADMIN_ROLE(), deployer.address);
            expect(hasAdminRole).to.be.true;
            console.log("✅ Admin Role:", deployer.address);
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
            expect(symbol).to.equal("THD");
            console.log("✅ Token Symbol:", symbol);
        });

        it("Should have correct decimals", async function () {
            const decimals = await tokenHub.decimals();
            expect(decimals).to.equal(18);
            console.log("✅ Token Decimals:", decimals.toString());
        });

        it("Should have correct total supply", async function () {
            const totalSupply = await tokenHub.totalSupply();
            const expectedSupply = ethers.parseUnits("100000000", 18); // 100M THD
            
            expect(totalSupply).to.equal(expectedSupply);
            console.log("✅ Total Supply:", ethers.formatUnits(totalSupply, 18), "THD");
        });

        it("Should be ERC-20 compliant", async function () {
            // Test basic ERC-20 functions
            const name = await tokenHub.name();
            const symbol = await tokenHub.symbol();
            const decimals = await tokenHub.decimals();
            const totalSupply = await tokenHub.totalSupply();
            
            expect(name).to.be.a('string');
            expect(symbol).to.be.a('string');
            expect(decimals).to.be.a('number');
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

        it("Should be Utility & Governance Token", async function () {
            // Test utility features
            const vipTier = await tokenHub.getVIPTier(deployer.address);
            const votingPower = await tokenHub.getVotingPower(deployer.address);
            
            expect(vipTier).to.be.a('bigint');
            expect(votingPower).to.be.a('bigint');
            
            console.log("✅ Utility Features: VIP Tier =", vipTier.toString());
            console.log("✅ Governance Features: Voting Power =", ethers.formatUnits(votingPower, 18), "THD");
        });
    });

    describe("3. Token Allocation Verification", function () {
        it("Should have correct team allocation (7%)", async function () {
            const teamAllocation = await tokenHub.TEAM_ALLOCATION();
            const totalSupply = await tokenHub.totalSupply();
            const teamPercentage = (teamAllocation * 100n) / totalSupply;
            
            expect(teamPercentage).to.equal(7n);
            console.log("✅ Team Allocation:", ethers.formatUnits(teamAllocation, 18), "THD (7%)");
        });

        it("Should have correct community allocation (20%)", async function () {
            const communityAllocation = await tokenHub.COMMUNITY_ALLOCATION();
            const totalSupply = await tokenHub.totalSupply();
            const communityPercentage = (communityAllocation * 100n) / totalSupply;
            
            expect(communityPercentage).to.equal(20n);
            console.log("✅ Community Allocation:", ethers.formatUnits(communityAllocation, 18), "THD (20%)");
        });

        it("Should have correct staking allocation (10%)", async function () {
            const stakingAllocation = await tokenHub.STAKING_ALLOCATION();
            const totalSupply = await tokenHub.totalSupply();
            const stakingPercentage = (stakingAllocation * 100n) / totalSupply;
            
            expect(stakingPercentage).to.equal(10n);
            console.log("✅ Staking Allocation:", ethers.formatUnits(stakingAllocation, 18), "THD (10%)");
        });

        it("Should have correct ecosystem allocation (25%)", async function () {
            const ecosystemAllocation = await tokenHub.ECOSYSTEM_ALLOCATION();
            const totalSupply = await tokenHub.totalSupply();
            const ecosystemPercentage = (ecosystemAllocation * 100n) / totalSupply;
            
            expect(ecosystemPercentage).to.equal(25n);
            console.log("✅ Ecosystem Allocation:", ethers.formatUnits(ecosystemAllocation, 18), "THD (25%)");
        });

        it("Should have correct treasury allocation (20%)", async function () {
            const treasuryAllocation = await tokenHub.TREASURY_ALLOCATION();
            const totalSupply = await tokenHub.totalSupply();
            const treasuryPercentage = (treasuryAllocation * 100n) / totalSupply;
            
            expect(treasuryPercentage).to.equal(20n);
            console.log("✅ Treasury Allocation:", ethers.formatUnits(treasuryAllocation, 18), "THD (20%)");
        });

        it("Should have correct liquidity allocation (15%)", async function () {
            const liquidityAllocation = await tokenHub.LIQUIDITY_ALLOCATION();
            const totalSupply = await tokenHub.totalSupply();
            const liquidityPercentage = (liquidityAllocation * 100n) / totalSupply;
            
            expect(liquidityPercentage).to.equal(15n);
            console.log("✅ Liquidity Allocation:", ethers.formatUnits(liquidityAllocation, 18), "THD (15%)");
        });

        it("Should have correct node OG allocation (3%)", async function () {
            const nodeOGAllocation = await tokenHub.NODE_OG_ALLOCATION();
            const totalSupply = await tokenHub.totalSupply();
            const nodeOGPercentage = (nodeOGAllocation * 100n) / totalSupply;
            
            expect(nodeOGPercentage).to.equal(3n);
            console.log("✅ Node OG Allocation:", ethers.formatUnits(nodeOGAllocation, 18), "THD (3%)");
        });

        it("Should have total allocation equal to 100%", async function () {
            const teamAllocation = await tokenHub.TEAM_ALLOCATION();
            const nodeOGAllocation = await tokenHub.NODE_OG_ALLOCATION();
            const liquidityAllocation = await tokenHub.LIQUIDITY_ALLOCATION();
            const communityAllocation = await tokenHub.COMMUNITY_ALLOCATION();
            const stakingAllocation = await tokenHub.STAKING_ALLOCATION();
            const ecosystemAllocation = await tokenHub.ECOSYSTEM_ALLOCATION();
            const treasuryAllocation = await tokenHub.TREASURY_ALLOCATION();
            
            const totalAllocation = teamAllocation + nodeOGAllocation + liquidityAllocation + 
                                  communityAllocation + stakingAllocation + ecosystemAllocation + 
                                  treasuryAllocation;
            
            const totalSupply = await tokenHub.totalSupply();
            
            expect(totalAllocation).to.equal(totalSupply);
            console.log("✅ Total Allocation:", ethers.formatUnits(totalAllocation, 18), "THD (100%)");
        });
    });

    describe("4. Token Information Summary", function () {
        it("Should display complete token information", async function () {
            const tokenInfo = await tokenHub.getTokenInfo();
            
            console.log("\n📊 ===== TOKEN INFORMATION SUMMARY =====");
            console.log("Project Name:", tokenInfo.name_);
            console.log("Token Symbol:", tokenInfo.symbol_);
            console.log("Token Decimals:", tokenInfo.decimals_.toString());
            console.log("Total Supply:", ethers.formatUnits(tokenInfo.totalSupply_, 18), "THD");
            console.log("Total Burned:", ethers.formatUnits(tokenInfo.totalBurned_, 18), "THD");
            console.log("Minting Enabled:", tokenInfo.mintingEnabled_);
            console.log("Burning Enabled:", tokenInfo.burningEnabled_);
            
            // Verify all information
            expect(tokenInfo.name_).to.equal("Token Hub");
            expect(tokenInfo.symbol_).to.equal("THD");
            expect(tokenInfo.decimals_).to.equal(18);
            expect(tokenInfo.totalSupply_).to.equal(ethers.parseUnits("100000000", 18));
            expect(tokenInfo.mintingEnabled_).to.be.true;
            expect(tokenInfo.burningEnabled_).to.be.true;
            
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
