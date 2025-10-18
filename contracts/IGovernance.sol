// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title Governance Interface
/// @notice Interface cho DAO governance system
interface IGovernance {
    // ===== Structs =====
    struct Proposal {
        uint256 id;                 // ID của proposal
        address proposer;           // Người đề xuất
        string description;         // Mô tả proposal
        uint256 startTime;          // Thời gian bắt đầu vote
        uint256 endTime;            // Thời gian kết thúc vote
        uint256 forVotes;           // Số vote ủng hộ
        uint256 againstVotes;       // Số vote phản đối
        bool executed;              // Đã thực thi chưa
        bool canceled;              // Đã hủy chưa
        uint256 quorum;             // Số vote tối thiểu
    }

    struct VoteInfo {
        bool hasVoted;              // Đã vote chưa
        bool support;               // Ủng hộ hay phản đối
        uint256 weight;             // Trọng số vote
    }

    // ===== Events =====
    event ProposalCreated(
        uint256 indexed proposalId,
        address proposer,
        string description,
        uint256 startTime,
        uint256 endTime
    );
    event VoteCast(address indexed voter, uint256 proposalId, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCanceled(uint256 indexed proposalId);

    // ===== Functions =====
    function propose(string calldata description) external returns (uint256);
    function vote(uint256 proposalId, bool support) external;
    function execute(uint256 proposalId) external;
    function cancel(uint256 proposalId) external;
    
    function getProposal(uint256 proposalId) external view returns (Proposal memory);
    function getVoteInfo(uint256 proposalId, address voter) external view returns (VoteInfo memory);
    function getVotingPower(address voter) external view returns (uint256);
    function getQuorum() external view returns (uint256);
    function getProposalCount() external view returns (uint256);
}
