const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Test Token Ecosystem - Gas Optimization Tests", function () {
    let testToken;
    let vesting;
    let staking;
    let governance;
    let buybackBurn;
    let owner;
    let addr1;
    let addr2;
    let addrs;

    const TOTAL_SUPPLY = ethers.parseEther("100000000");
    const STAKE_AMOUNT = ethers.parseEther("1000");
    const VESTING_AMOUNT = ethers.parseEther("10000");

    beforeEach(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        // Deploy contracts
        const TestToken = await ethers.getContractFactory("TestToken");
        testToken = await TestToken.deploy(owner.address);
        await testToken.waitForDeployment();

        const TestTokenVesting = await ethers.getContractFactory("TestTokenVesting");
        vesting = await TestTokenVesting.deploy(await testToken.getAddress(), owner.address);
        await vesting.waitForDeployment();

        const TestTokenStaking = await ethers.getContractFactory("TestTokenStaking");
        staking = await TestTokenStaking.deploy(await testToken.getAddress(), owner.address);
        await staking.waitForDeployment();

        const TestTokenGovernance = await ethers.getContractFactory("TestTokenGovernance");
        governance = await TestTokenGovernance.deploy(await testToken.getAddress(), owner.address);
        await governance.waitForDeployment();

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

        // Setup connections
        await testToken.setVestingContract(await vesting.getAddress());
        await testToken.setStakingContract(await staking.getAddress());
        await testToken.setGovernanceContract(await governance.getAddress());
        await testToken.setBuybackContract(await buybackBurn.getAddress());

        // Approve contracts
        await testToken.approve(await vesting.getAddress(), ethers.parseEther("1000000"));
        await testToken.approve(await staking.getAddress(), ethers.parseEther("1000000"));
    });

    describe("Gas Usage Analysis", function () {
        it("Should measure gas for token transfers", async function () {
            const tx = await testToken.transfer(addr1.address, ethers.parseEther("1000"));
            const receipt = await tx.wait();
            
            console.log("Token transfer gas used:", receipt.gasUsed.toString());
            expect(receipt.gasUsed).to.be.lessThan(100000); // Should be efficient
        });

        it("Should measure gas for minting", async function () {
            const tx = await testToken.mint(addr1.address, ethers.parseEther("1000"), "Test mint");
            const receipt = await tx.wait();
            
            console.log("Token mint gas used:", receipt.gasUsed.toString());
            expect(receipt.gasUsed).to.be.lessThan(150000);
        });

        it("Should measure gas for burning", async function () {
            await testToken.transfer(addr1.address, ethers.parseEther("1000"));
            const tx = await testToken.connect(addr1).burn(ethers.parseEther("500"));
            const receipt = await tx.wait();
            
            console.log("Token burn gas used:", receipt.gasUsed.toString());
            expect(receipt.gasUsed).to.be.lessThan(100000);
        });

        it("Should measure gas for vesting creation", async function () {
            const tx = await vesting.createVestingSchedule(
                addr1.address,
                VESTING_AMOUNT,
                10, // 10% TGE
                0, // No cliff
                12 * 30 * 24 * 60 * 60, // 12 months
                "Community"
            );
            const receipt = await tx.wait();
            
            console.log("Vesting creation gas used:", receipt.gasUsed.toString());
            expect(receipt.gasUsed).to.be.lessThan(200000);
        });

        it("Should measure gas for vesting release", async function () {
            await vesting.createVestingSchedule(
                addr1.address,
                VESTING_AMOUNT,
                0, // No TGE
                0, // No cliff
                12 * 30 * 24 * 60 * 60, // 12 months
                "Community"
            );

            // Fast forward 6 months
            await time.increase(6 * 30 * 24 * 60 * 60);

            const tx = await vesting.connect(addr1).release();
            const receipt = await tx.wait();
            
            console.log("Vesting release gas used:", receipt.gasUsed.toString());
            expect(receipt.gasUsed).to.be.lessThan(150000);
        });

        it("Should measure gas for staking", async function () {
            await testToken.transfer(addr1.address, STAKE_AMOUNT);
            await testToken.connect(addr1).approve(await staking.getAddress(), STAKE_AMOUNT);
            
            const tx = await staking.connect(addr1).stake(STAKE_AMOUNT, 30 * 24 * 60 * 60);
            const receipt = await tx.wait();
            
            console.log("Staking gas used:", receipt.gasUsed.toString());
            expect(receipt.gasUsed).to.be.lessThan(200000);
        });

        it("Should measure gas for unstaking", async function () {
            await testToken.transfer(addr1.address, STAKE_AMOUNT);
            await testToken.connect(addr1).approve(await staking.getAddress(), STAKE_AMOUNT);
            await staking.connect(addr1).stake(STAKE_AMOUNT, 30 * 24 * 60 * 60);

            // Fast forward 30 days
            await time.increase(30 * 24 * 60 * 60 + 1);
            await testToken.mint(await staking.getAddress(), ethers.parseEther("1000"), "Rewards");

            const tx = await staking.connect(addr1).unstake();
            const receipt = await tx.wait();
            
            console.log("Unstaking gas used:", receipt.gasUsed.toString());
            expect(receipt.gasUsed).to.be.lessThan(250000);
        });

        it("Should measure gas for governance proposal", async function () {
            const tx = await governance.propose("Test proposal");
            const receipt = await tx.wait();
            
            console.log("Governance proposal gas used:", receipt.gasUsed.toString());
            expect(receipt.gasUsed).to.be.lessThan(200000);
        });

        it("Should measure gas for voting", async function () {
            await governance.propose("Test proposal");
            await time.increase(24 * 60 * 60 + 1);

            const tx = await governance.vote(0, true);
            const receipt = await tx.wait();
            
            console.log("Voting gas used:", receipt.gasUsed.toString());
            expect(receipt.gasUsed).to.be.lessThan(150000);
        });

        it("Should measure gas for proposal execution", async function () {
            await governance.propose("Test proposal");
            await time.increase(24 * 60 * 60 + 1);
            await governance.vote(0, true);
            await time.increase(3 * 24 * 60 * 60 + 1);

            const tx = await governance.execute(0);
            const receipt = await tx.wait();
            
            console.log("Proposal execution gas used:", receipt.gasUsed.toString());
            expect(receipt.gasUsed).to.be.lessThan(100000);
        });

        it("Should measure gas for buyback burn", async function () {
            await testToken.transfer(await buybackBurn.getAddress(), ethers.parseEther("1000"));

            const tx = await buybackBurn.executeBurn(ethers.parseEther("1000"));
            const receipt = await tx.wait();
            
            console.log("Buyback burn gas used:", receipt.gasUsed.toString());
            expect(receipt.gasUsed).to.be.lessThan(150000);
        });
    });

    describe("Batch Operations Gas Efficiency", function () {
        it("Should measure gas for multiple transfers", async function () {
            const users = addrs.slice(0, 10);
            const amount = ethers.parseEther("100");

            // Measure gas for multiple individual transfers
            let totalGas = 0;
            for (let i = 0; i < users.length; i++) {
                const tx = await testToken.transfer(users[i].address, amount);
                const receipt = await tx.wait();
                totalGas += Number(receipt.gasUsed);
            }

            console.log("Total gas for 10 individual transfers:", totalGas);
            console.log("Average gas per transfer:", totalGas / 10);
            expect(totalGas / 10).to.be.lessThan(100000);
        });

        it("Should measure gas for multiple mints", async function () {
            const users = addrs.slice(0, 5);
            const amount = ethers.parseEther("1000");

            let totalGas = 0;
            for (let i = 0; i < users.length; i++) {
                const tx = await testToken.mint(users[i].address, amount, `Mint ${i}`);
                const receipt = await tx.wait();
                totalGas += Number(receipt.gasUsed);
            }

            console.log("Total gas for 5 individual mints:", totalGas);
            console.log("Average gas per mint:", totalGas / 5);
            expect(totalGas / 5).to.be.lessThan(150000);
        });

        it("Should measure gas for multiple staking operations", async function () {
            const users = addrs.slice(0, 5);
            const amount = ethers.parseEther("1000");

            // Transfer tokens to users
            for (let i = 0; i < users.length; i++) {
                await testToken.transfer(users[i].address, amount);
            }

            let totalGas = 0;
            for (let i = 0; i < users.length; i++) {
                await testToken.connect(users[i]).approve(await staking.getAddress(), amount);
                const tx = await staking.connect(users[i]).stake(amount, 30 * 24 * 60 * 60);
                const receipt = await tx.wait();
                totalGas += Number(receipt.gasUsed);
            }

            console.log("Total gas for 5 individual stakes:", totalGas);
            console.log("Average gas per stake:", totalGas / 5);
            expect(totalGas / 5).to.be.lessThan(200000);
        });
    });

    describe("Storage Optimization", function () {
        it("Should efficiently store vesting schedules", async function () {
            const schedules = [];
            const users = addrs.slice(0, 20);

            let totalGas = 0;
            for (let i = 0; i < users.length; i++) {
                const tx = await vesting.createVestingSchedule(
                    users[i].address,
                    VESTING_AMOUNT,
                    10,
                    0,
                    12 * 30 * 24 * 60 * 60,
                    `Category${i}`
                );
                const receipt = await tx.wait();
                totalGas += Number(receipt.gasUsed);
                schedules.push(receipt.gasUsed);
            }

            console.log("Total gas for 20 vesting schedules:", totalGas);
            console.log("Average gas per vesting schedule:", totalGas / 20);
            expect(totalGas / 20).to.be.lessThan(200000);
        });

        it("Should efficiently store governance proposals", async function () {
            let totalGas = 0;
            for (let i = 0; i < 10; i++) {
                const tx = await governance.propose(`Proposal ${i} - Test governance efficiency`);
                const receipt = await tx.wait();
                totalGas += Number(receipt.gasUsed);
            }

            console.log("Total gas for 10 governance proposals:", totalGas);
            console.log("Average gas per proposal:", totalGas / 10);
            expect(totalGas / 10).to.be.lessThan(200000);
        });
    });

    describe("View Function Gas Efficiency", function () {
        it("Should efficiently read token information", async function () {
            const tx = await testToken.getTokenInfo();
            // View functions don't consume gas, but we can measure the call
            expect(tx).to.not.be.undefined;
        });

        it("Should efficiently read vesting information", async function () {
            await vesting.createVestingSchedule(
                addr1.address,
                VESTING_AMOUNT,
                10,
                0,
                12 * 30 * 24 * 60 * 60,
                "Test"
            );

            const schedule = await vesting.getVestingSchedule(addr1.address);
            expect(schedule.totalAmount).to.equal(VESTING_AMOUNT);
        });

        it("Should efficiently read staking information", async function () {
            await testToken.transfer(addr1.address, STAKE_AMOUNT);
            await testToken.connect(addr1).approve(await staking.getAddress(), STAKE_AMOUNT);
            await staking.connect(addr1).stake(STAKE_AMOUNT, 30 * 24 * 60 * 60);

            const stakeInfo = await staking.getStakeInfo(addr1.address);
            expect(stakeInfo.amount).to.equal(STAKE_AMOUNT);
        });

        it("Should efficiently read governance information", async function () {
            await governance.propose("Test proposal");
            const proposal = await governance.getProposal(0);
            expect(proposal.description).to.equal("Test proposal");
        });
    });

    describe("Gas Limit Stress Tests", function () {
        it("Should handle maximum complexity operations", async function () {
            // Create complex scenario with multiple operations
            const users = addrs.slice(0, 5);

            // Setup users
            for (let i = 0; i < users.length; i++) {
                await testToken.transfer(users[i].address, ethers.parseEther("10000"));
            }

            // Create vesting schedules
            for (let i = 0; i < users.length; i++) {
                await vesting.createVestingSchedule(
                    users[i].address,
                    ethers.parseEther("5000"),
                    10,
                    0,
                    12 * 30 * 24 * 60 * 60,
                    `Category${i}`
                );
            }

            // Stake tokens
            for (let i = 0; i < users.length; i++) {
                await testToken.connect(users[i]).approve(await staking.getAddress(), ethers.parseEther("1000"));
                await staking.connect(users[i]).stake(ethers.parseEther("1000"), 30 * 24 * 60 * 60);
            }

            // Create governance proposals
            for (let i = 0; i < 3; i++) {
                await governance.propose(`Complex proposal ${i}`);
            }

            // All operations should complete successfully
            expect(await vesting.getBeneficiaryCount()).to.equal(5);
            expect(await governance.getProposalCount()).to.equal(3);
            expect(await staking.getPoolInfo()).to.not.be.undefined;
        });

        it("Should handle large data operations efficiently", async function () {
            // Test with large amounts
            const largeAmount = ethers.parseEther("1000000");
            
            const tx = await testToken.mint(addr1.address, largeAmount, "Large mint test");
            const receipt = await tx.wait();
            
            console.log("Large mint gas used:", receipt.gasUsed.toString());
            expect(receipt.gasUsed).to.be.lessThan(200000);
        });
    });

    describe("Gas Optimization Recommendations", function () {
        it("Should demonstrate efficient batch operations", async function () {
            // This test shows how batch operations can be more efficient
            const users = addrs.slice(0, 3);
            const amount = ethers.parseEther("1000");

            // Individual operations
            let individualGas = 0;
            for (let i = 0; i < users.length; i++) {
                const tx = await testToken.transfer(users[i].address, amount);
                const receipt = await tx.wait();
                individualGas += Number(receipt.gasUsed);
            }

            console.log("Individual operations total gas:", individualGas);
            console.log("Recommendation: Consider batch operations for better efficiency");
        });

        it("Should demonstrate efficient storage patterns", async function () {
            // Test efficient storage usage
            const tx = await vesting.createVestingSchedule(
                addr1.address,
                VESTING_AMOUNT,
                10,
                0,
                12 * 30 * 24 * 60 * 60,
                "Efficient"
            );
            const receipt = await tx.wait();

            console.log("Vesting storage gas:", receipt.gasUsed.toString());
            console.log("Recommendation: Pack structs efficiently to reduce storage costs");
        });
    });
});
