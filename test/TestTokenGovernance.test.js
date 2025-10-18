const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("TestTokenGovernance - Unit Tests", function () {
    let testToken;
    let governance;
    let owner;
    let addr1;
    let addr2;
    let addrs;

    const PROPOSAL_THRESHOLD = ethers.parseEther("1000");
    const VOTING_DELAY = 24 * 60 * 60; // 1 day
    const VOTING_PERIOD = 3 * 24 * 60 * 60; // 3 days

    beforeEach(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        // Deploy TestToken
        const TestToken = await ethers.getContractFactory("TestToken");
        testToken = await TestToken.deploy(owner.address);
        await testToken.waitForDeployment();

        // Deploy Governance
        const TestTokenGovernance = await ethers.getContractFactory("TestTokenGovernance");
        governance = await TestTokenGovernance.deploy(await testToken.getAddress(), owner.address);
        await governance.waitForDeployment();

        // Transfer tokens to users for voting
        await testToken.transfer(addr1.address, ethers.parseEther("10000"));
        await testToken.transfer(addr2.address, ethers.parseEther("5000"));
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await governance.hasRole(await governance.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
        });

        it("Should set correct test token address", async function () {
            expect(await governance.testToken()).to.equal(await testToken.getAddress());
        });

        it("Should initialize with correct default values", async function () {
            expect(await governance.quorumPercentage()).to.equal(10); // 10%
            expect(await governance.votingDelay()).to.equal(VOTING_DELAY);
            expect(await governance.votingPeriod()).to.equal(VOTING_PERIOD);
            expect(await governance.proposalThreshold()).to.equal(PROPOSAL_THRESHOLD);
            expect(await governance.getProposalCount()).to.equal(0);
        });
    });

    describe("Proposal Creation", function () {
        it("Should create proposal correctly", async function () {
            await governance.propose("Test proposal for ecosystem");
            
            const proposal = await governance.getProposal(0);
            expect(proposal.description).to.equal("Test proposal for ecosystem");
            expect(proposal.proposer).to.equal(owner.address);
            expect(proposal.executed).to.be.false;
            expect(proposal.canceled).to.be.false;
        });

        it("Should emit ProposalCreated event", async function () {
            await expect(governance.propose("Test proposal"))
                .to.emit(governance, "ProposalCreated")
                .withArgs(0, owner.address, "Test proposal", anyValue, anyValue);
        });

        it("Should increment proposal count", async function () {
            expect(await governance.getProposalCount()).to.equal(0);
            await governance.propose("Test proposal");
            expect(await governance.getProposalCount()).to.equal(1);
        });

        it("Should not create proposal without sufficient voting power", async function () {
            await expect(governance.connect(addr2).propose("Test proposal"))
                .to.be.revertedWithCustomError(governance, "InsufficientVotingPower");
        });

        it("Should only allow PROPOSER_ROLE to create proposals", async function () {
            // Grant PROPOSER_ROLE to addr1
            await governance.grantRole(await governance.PROPOSER_ROLE(), addr1.address);
            
            await governance.connect(addr1).propose("Test proposal from addr1");
            
            const proposal = await governance.getProposal(0);
            expect(proposal.proposer).to.equal(addr1.address);
        });

        it("Should not allow non-PROPOSER_ROLE to create proposals", async function () {
            await expect(governance.connect(addr1).propose("Test proposal"))
                .to.be.revertedWithCustomError(governance, "Unauthorized");
        });
    });

    describe("Voting", function () {
        beforeEach(async function () {
            await governance.propose("Test proposal for voting");
            // Fast forward past voting delay
            await time.increase(VOTING_DELAY + 1);
        });

        it("Should vote correctly", async function () {
            await governance.vote(0, true);
            
            const voteInfo = await governance.getVoteInfo(0, owner.address);
            expect(voteInfo.hasVoted).to.be.true;
            expect(voteInfo.support).to.be.true;
            expect(voteInfo.weight).to.be.greaterThan(0);
        });

        it("Should emit VoteCast event", async function () {
            const votingPower = await governance.getVotingPower(owner.address);
            await expect(governance.vote(0, true))
                .to.emit(governance, "VoteCast")
                .withArgs(owner.address, 0, true, votingPower);
        });

        it("Should not vote before voting starts", async function () {
            // Create new proposal
            await governance.propose("New proposal");
            
            await expect(governance.vote(1, true))
                .to.be.revertedWith("Voting not started");
        });

        it("Should not vote after voting ends", async function () {
            // Fast forward past voting period
            await time.increase(VOTING_PERIOD + 1);
            
            await expect(governance.vote(0, true))
                .to.be.revertedWithCustomError(governance, "VotingEnded");
        });

        it("Should not vote twice", async function () {
            await governance.vote(0, true);
            await expect(governance.vote(0, false))
                .to.be.revertedWithCustomError(governance, "AlreadyVoted");
        });

        it("Should not vote without voting power", async function () {
            // Create account with no tokens
            const [noTokenAccount] = await ethers.getSigners();
            await expect(governance.connect(noTokenAccount).vote(0, true))
                .to.be.revertedWithCustomError(governance, "InsufficientVotingPower");
        });

        it("Should calculate voting power correctly", async function () {
            const votingPower = await governance.getVotingPower(owner.address);
            expect(votingPower).to.equal(await testToken.balanceOf(owner.address));
        });

        it("Should update proposal vote counts", async function () {
            await governance.vote(0, true);
            
            const proposal = await governance.getProposal(0);
            expect(proposal.forVotes).to.be.greaterThan(0);
            expect(proposal.againstVotes).to.equal(0);
        });
    });

    describe("Proposal Execution", function () {
        beforeEach(async function () {
            await governance.propose("Test proposal for execution");
            // Fast forward past voting delay
            await time.increase(VOTING_DELAY + 1);
            await governance.vote(0, true);
            // Fast forward past voting period
            await time.increase(VOTING_PERIOD + 1);
        });

        it("Should execute proposal correctly", async function () {
            await governance.execute(0);
            
            const proposal = await governance.getProposal(0);
            expect(proposal.executed).to.be.true;
        });

        it("Should emit ProposalExecuted event", async function () {
            await expect(governance.execute(0))
                .to.emit(governance, "ProposalExecuted")
                .withArgs(0);
        });

        it("Should not execute before voting ends", async function () {
            // Create new proposal
            await governance.propose("New proposal");
            await time.increase(VOTING_DELAY + 1);
            await governance.vote(1, true);
            
            await expect(governance.execute(1))
                .to.be.revertedWith("Voting not ended");
        });

        it("Should not execute without quorum", async function () {
            // Create proposal with insufficient votes
            await governance.propose("Low quorum proposal");
            await time.increase(VOTING_DELAY + 1);
            // Don't vote (no quorum)
            await time.increase(VOTING_PERIOD + 1);
            
            await expect(governance.execute(1))
                .to.be.revertedWith("Quorum not met");
        });

        it("Should not execute rejected proposal", async function () {
            // Create proposal and vote against
            await governance.propose("Rejected proposal");
            await time.increase(VOTING_DELAY + 1);
            await governance.vote(1, false);
            await time.increase(VOTING_PERIOD + 1);
            
            await expect(governance.execute(1))
                .to.be.revertedWith("Proposal rejected");
        });

        it("Should not execute already executed proposal", async function () {
            await governance.execute(0);
            await expect(governance.execute(0))
                .to.be.revertedWith("Already executed");
        });

        it("Should not execute canceled proposal", async function () {
            // Cancel proposal first
            await governance.cancel(0);
            await expect(governance.execute(0))
                .to.be.revertedWith("Proposal canceled");
        });

        it("Should only allow EXECUTOR_ROLE to execute", async function () {
            await expect(governance.connect(addr1).execute(0))
                .to.be.revertedWithCustomError(governance, "Unauthorized");
        });
    });

    describe("Proposal Cancellation", function () {
        beforeEach(async function () {
            await governance.propose("Test proposal for cancellation");
        });

        it("Should cancel proposal correctly", async function () {
            await governance.cancel(0);
            
            const proposal = await governance.getProposal(0);
            expect(proposal.canceled).to.be.true;
        });

        it("Should emit ProposalCanceled event", async function () {
            await expect(governance.cancel(0))
                .to.emit(governance, "ProposalCanceled")
                .withArgs(0);
        });

        it("Should not cancel non-existent proposal", async function () {
            await expect(governance.cancel(999))
                .to.be.revertedWithCustomError(governance, "ProposalNotFound");
        });

        it("Should not cancel already executed proposal", async function () {
            // Execute proposal first
            await time.increase(VOTING_DELAY + 1);
            await governance.vote(0, true);
            await time.increase(VOTING_PERIOD + 1);
            await governance.execute(0);
            
            await expect(governance.cancel(0))
                .to.be.revertedWith("Already executed");
        });

        it("Should not cancel already canceled proposal", async function () {
            await governance.cancel(0);
            await expect(governance.cancel(0))
                .to.be.revertedWith("Already canceled");
        });

        it("Should allow proposer to cancel their proposal", async function () {
            // Grant PROPOSER_ROLE to addr1
            await governance.grantRole(await governance.PROPOSER_ROLE(), addr1.address);
            await governance.connect(addr1).propose("Proposal from addr1");
            
            await governance.connect(addr1).cancel(1);
            
            const proposal = await governance.getProposal(1);
            expect(proposal.canceled).to.be.true;
        });

        it("Should allow admin to cancel any proposal", async function () {
            // Grant PROPOSER_ROLE to addr1
            await governance.grantRole(await governance.PROPOSER_ROLE(), addr1.address);
            await governance.connect(addr1).propose("Proposal from addr1");
            
            await governance.cancel(1); // Admin cancels addr1's proposal
            
            const proposal = await governance.getProposal(1);
            expect(proposal.canceled).to.be.true;
        });

        it("Should not allow others to cancel proposal", async function () {
            await expect(governance.connect(addr1).cancel(0))
                .to.be.revertedWithCustomError(governance, "Unauthorized");
        });
    });

    describe("Admin Functions", function () {
        it("Should set quorum percentage correctly", async function () {
            await governance.setQuorumPercentage(15);
            expect(await governance.quorumPercentage()).to.equal(15);
        });

        it("Should emit QuorumUpdated event", async function () {
            await expect(governance.setQuorumPercentage(15))
                .to.emit(governance, "QuorumUpdated")
                .withArgs(15);
        });

        it("Should not set invalid quorum percentage", async function () {
            await expect(governance.setQuorumPercentage(101))
                .to.be.revertedWith("Invalid quorum");
        });

        it("Should set voting delay correctly", async function () {
            const newDelay = 2 * 24 * 60 * 60; // 2 days
            await governance.setVotingDelay(newDelay);
            expect(await governance.votingDelay()).to.equal(newDelay);
        });

        it("Should set voting period correctly", async function () {
            const newPeriod = 5 * 24 * 60 * 60; // 5 days
            await governance.setVotingPeriod(newPeriod);
            expect(await governance.votingPeriod()).to.equal(newPeriod);
        });

        it("Should set proposal threshold correctly", async function () {
            const newThreshold = ethers.parseEther("2000");
            await governance.setProposalThreshold(newThreshold);
            expect(await governance.proposalThreshold()).to.equal(newThreshold);
        });

        it("Should only allow admin to set parameters", async function () {
            await expect(governance.connect(addr1).setQuorumPercentage(15))
                .to.be.revertedWithCustomError(governance, "Unauthorized");
        });
    });

    describe("View Functions", function () {
        beforeEach(async function () {
            await governance.propose("Test proposal");
        });

        it("Should return correct proposal info", async function () {
            const proposal = await governance.getProposal(0);
            expect(proposal.id).to.equal(0);
            expect(proposal.description).to.equal("Test proposal");
            expect(proposal.proposer).to.equal(owner.address);
        });

        it("Should return correct vote info", async function () {
            // Fast forward and vote
            await time.increase(VOTING_DELAY + 1);
            await governance.vote(0, true);
            
            const voteInfo = await governance.getVoteInfo(0, owner.address);
            expect(voteInfo.hasVoted).to.be.true;
            expect(voteInfo.support).to.be.true;
        });

        it("Should return correct voting power", async function () {
            const votingPower = await governance.getVotingPower(owner.address);
            expect(votingPower).to.equal(await testToken.balanceOf(owner.address));
        });

        it("Should return correct quorum", async function () {
            const quorum = await governance.getQuorum();
            const expectedQuorum = (await testToken.totalSupply() * 10n) / 100n;
            expect(quorum).to.equal(expectedQuorum);
        });

        it("Should return correct proposal state", async function () {
            let state = await governance.getProposalState(0);
            expect(state).to.equal("Pending");
            
            // Fast forward past delay
            await time.increase(VOTING_DELAY + 1);
            state = await governance.getProposalState(0);
            expect(state).to.equal("Active");
            
            // Fast forward past period
            await time.increase(VOTING_PERIOD + 1);
            state = await governance.getProposalState(0);
            expect(state).to.equal("Succeeded");
        });

        it("Should return correct proposal count", async function () {
            expect(await governance.getProposalCount()).to.equal(1);
            
            await governance.propose("Second proposal");
            expect(await governance.getProposalCount()).to.equal(2);
        });
    });

    describe("Edge Cases", function () {
        it("Should handle multiple proposals", async function () {
            await governance.propose("First proposal");
            await governance.propose("Second proposal");
            await governance.propose("Third proposal");
            
            expect(await governance.getProposalCount()).to.equal(3);
            
            const proposal1 = await governance.getProposal(0);
            const proposal2 = await governance.getProposal(1);
            const proposal3 = await governance.getProposal(2);
            
            expect(proposal1.description).to.equal("First proposal");
            expect(proposal2.description).to.equal("Second proposal");
            expect(proposal3.description).to.equal("Third proposal");
        });

        it("Should handle very long proposal descriptions", async function () {
            const longDescription = "A".repeat(1000);
            await governance.propose(longDescription);
            
            const proposal = await governance.getProposal(0);
            expect(proposal.description).to.equal(longDescription);
        });

        it("Should handle zero voting power", async function () {
            const [zeroBalanceAccount] = await ethers.getSigners();
            const votingPower = await governance.getVotingPower(zeroBalanceAccount.address);
            expect(votingPower).to.equal(0);
        });

        it("Should handle very large voting power", async function () {
            // Mint large amount to owner
            await testToken.mint(owner.address, ethers.parseEther("1000000"), "Large voting power");
            
            const votingPower = await governance.getVotingPower(owner.address);
            expect(votingPower).to.be.greaterThan(ethers.parseEther("1000000"));
        });
    });
});
