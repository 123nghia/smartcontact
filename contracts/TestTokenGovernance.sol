// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./ITestToken.sol";
import "./IGovernance.sol";

/// @title Test Token Governance Contract
/// @notice DAO governance system cho Test Token ecosystem
/// @dev Hỗ trợ proposal creation, voting, và execution với timelock
contract TestTokenGovernance is AccessControl, ReentrancyGuard, IGovernance {
    // ===== Roles =====
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    
    // ===== State Variables =====
    ITestToken public immutable testToken;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => VoteInfo)) public votes;
    
    uint256 public proposalCount;
    uint256 public quorumPercentage = 10; // 10% of total supply
    uint256 public votingDelay = 1 days;
    uint256 public votingPeriod = 3 days;
    uint256 public proposalThreshold = 1000 * 10**18; // 1000 THB
    uint256 public executionDelay = 2 days; // ✅ THÊM: Timelock period
    
    // ===== Events =====
    event QuorumUpdated(uint256 newQuorum);
    event VotingDelayUpdated(uint256 newDelay);
    event VotingPeriodUpdated(uint256 newPeriod);
    event ProposalThresholdUpdated(uint256 newThreshold);
    event ExecutionDelayUpdated(uint256 newDelay); // ✅ THÊM
    
    constructor(address _testToken, address admin) {
        if (_testToken == address(0)) revert ITestToken.ZeroAddress();
        if (admin == address(0)) revert ITestToken.ZeroAddress();
        
        testToken = ITestToken(_testToken);
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(PROPOSER_ROLE, admin);
        _setupRole(EXECUTOR_ROLE, admin);
    }
    
    // ===== Proposal Functions =====
    function propose(string calldata description) external onlyRole(PROPOSER_ROLE) returns (uint256) {
        if (testToken.balanceOf(_msgSender()) < proposalThreshold) revert ITestToken.InsufficientVotingPower();
        
        uint256 proposalId = proposalCount++;
        uint256 startTime = block.timestamp + votingDelay;
        uint256 endTime = startTime + votingPeriod;
        
        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: _msgSender(),
            description: description,
            startTime: startTime,
            endTime: endTime,
            forVotes: 0,
            againstVotes: 0,
            executed: false,
            canceled: false,
            quorum: getQuorum()
        });
        
        emit ProposalCreated(proposalId, _msgSender(), description, startTime, endTime);
        return proposalId;
    }
    
    function vote(uint256 proposalId, bool support) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        if (proposal.id != proposalId) revert ITestToken.ProposalNotFound();
        if (block.timestamp < proposal.startTime) revert("Voting not started");
        if (block.timestamp > proposal.endTime) revert ITestToken.VotingEnded();
        if (votes[proposalId][_msgSender()].hasVoted) revert ITestToken.AlreadyVoted();
        
        uint256 weight = getVotingPower(_msgSender());
        if (weight == 0) revert ITestToken.InsufficientVotingPower();
        
        votes[proposalId][_msgSender()] = VoteInfo({
            hasVoted: true,
            support: support,
            weight: weight
        });
        
        if (support) {
            proposal.forVotes += weight;
        } else {
            proposal.againstVotes += weight;
        }
        
        emit VoteCast(_msgSender(), proposalId, support, weight);
    }
    
    // ✅ FIXED: Thêm timelock check
    function execute(uint256 proposalId) external onlyRole(EXECUTOR_ROLE) {
        Proposal storage proposal = proposals[proposalId];
        if (proposal.id != proposalId) revert ITestToken.ProposalNotFound();
        if (proposal.executed) revert("Already executed");
        if (proposal.canceled) revert("Proposal canceled");
        if (block.timestamp <= proposal.endTime) revert("Voting not ended");
        
        // ✅ CRITICAL: Timelock check để community có thời gian phản ứng
        if (block.timestamp < proposal.endTime + executionDelay) {
            revert("Execution delay not passed");
        }
        
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
        if (totalVotes < proposal.quorum) revert("Quorum not met");
        
        if (proposal.forVotes > proposal.againstVotes) {
            proposal.executed = true;
            emit ProposalExecuted(proposalId);
            
            // Execute proposal logic here
            _executeProposal(proposalId);
        } else {
            revert("Proposal rejected");
        }
    }
    
    function cancel(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        if (proposal.id != proposalId) revert ITestToken.ProposalNotFound();
        if (proposal.executed) revert("Already executed");
        if (proposal.canceled) revert("Already canceled");
        
        // Only proposer or admin can cancel
        if (_msgSender() != proposal.proposer && !hasRole(DEFAULT_ADMIN_ROLE, _msgSender())) {
            revert ITestToken.Unauthorized();
        }
        
        proposal.canceled = true;
        emit ProposalCanceled(proposalId);
    }
    
    // ===== Admin Functions =====
    function setQuorumPercentage(uint256 newQuorum) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newQuorum > 100) revert("Invalid quorum");
        quorumPercentage = newQuorum;
        emit QuorumUpdated(newQuorum);
    }
    
    function setVotingDelay(uint256 newDelay) external onlyRole(DEFAULT_ADMIN_ROLE) {
        votingDelay = newDelay;
        emit VotingDelayUpdated(newDelay);
    }
    
    function setVotingPeriod(uint256 newPeriod) external onlyRole(DEFAULT_ADMIN_ROLE) {
        votingPeriod = newPeriod;
        emit VotingPeriodUpdated(newPeriod);
    }
    
    function setProposalThreshold(uint256 newThreshold) external onlyRole(DEFAULT_ADMIN_ROLE) {
        proposalThreshold = newThreshold;
        emit ProposalThresholdUpdated(newThreshold);
    }
    
    // ✅ THÊM: Set execution delay
    function setExecutionDelay(uint256 newDelay) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newDelay > 7 days) revert("Delay too long");
        executionDelay = newDelay;
        emit ExecutionDelayUpdated(newDelay);
    }
    
    // ===== View Functions =====
    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        return proposals[proposalId];
    }
    
    function getVoteInfo(uint256 proposalId, address voter) external view returns (VoteInfo memory) {
        return votes[proposalId][voter];
    }
    
    function getVotingPower(address voter) public view returns (uint256) {
        return testToken.balanceOf(voter);
    }
    
    function getQuorum() public view returns (uint256) {
        return (testToken.totalSupply() * quorumPercentage) / 100;
    }
    
    function getProposalCount() external view returns (uint256) {
        return proposalCount;
    }
    
    // ✅ IMPROVED: Thêm state "Queued" với timelock
    function getProposalState(uint256 proposalId) external view returns (string memory) {
        Proposal memory proposal = proposals[proposalId];
        if (proposal.id != proposalId) return "Invalid";
        if (proposal.canceled) return "Canceled";
        if (proposal.executed) return "Executed";
        if (block.timestamp < proposal.startTime) return "Pending";
        if (block.timestamp <= proposal.endTime) return "Active";
        
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
        
        // Defeated
        if (proposal.forVotes <= proposal.againstVotes) return "Defeated";
        
        // Quorum not met
        if (totalVotes < proposal.quorum) return "Failed";
        
        // Succeeded but still in timelock
        if (block.timestamp < proposal.endTime + executionDelay) return "Queued";
        
        // Ready to execute
        return "Executable";
    }
    
    // ✅ THÊM: Check khi nào có thể execute
    function canExecute(uint256 proposalId) external view returns (bool) {
        Proposal memory proposal = proposals[proposalId];
        if (proposal.id != proposalId) return false;
        if (proposal.executed || proposal.canceled) return false;
        if (block.timestamp <= proposal.endTime) return false;
        if (block.timestamp < proposal.endTime + executionDelay) return false;
        
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
        if (totalVotes < proposal.quorum) return false;
        if (proposal.forVotes <= proposal.againstVotes) return false;
        
        return true;
    }
    
    // ✅ THÊM: Thời gian còn lại để execute
    function getTimeUntilExecutable(uint256 proposalId) external view returns (uint256) {
        Proposal memory proposal = proposals[proposalId];
        if (proposal.id != proposalId) return 0;
        
        uint256 executableTime = proposal.endTime + executionDelay;
        if (block.timestamp >= executableTime) return 0;
        
        return executableTime - block.timestamp;
    }
    
    // ===== Internal Functions =====
    function _executeProposal(uint256 proposalId) internal {
        // Implement proposal execution logic here
        // This would typically involve calling functions on other contracts
        // based on the proposal description and parameters
    }
}