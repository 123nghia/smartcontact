// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Token Hub Interface
/// @notice Interface chính cho Token Hub ecosystem
interface ITokenHub is IERC20 {
    // ===== Events =====
    event TokensMinted(address indexed to, uint256 amount, string purpose);
    event TokensBurned(address indexed from, uint256 amount, string purpose);
    event TokensTransferred(address indexed from, address indexed to, uint256 amount);
    event TokensStaked(address indexed user, uint256 amount, uint256 lockDuration);
    event TokensUnstaked(address indexed user, uint256 amount);
    event StakingRewardsClaimed(address indexed user, uint256 amount);
    event VoteCast(address indexed voter, uint256 proposalId, bool support, uint256 weight);
    event ProposalCreated(uint256 indexed proposalId, address proposer, string description);
    event ProposalExecuted(uint256 indexed proposalId);
    event VestedTokensReleased(address indexed beneficiary, uint256 amount);
    event Blacklisted(address indexed account, bool status);
    event FeeDiscountUpdated(address indexed account, uint256 discount);
    event VIPTierUpdated(address indexed account, uint8 tier);

    // ===== Functions =====
    function mint(address to, uint256 amount, string calldata purpose) external;
    function burn(uint256 amount) external;
    function burnFrom(address account, uint256 amount) external;

    // ===== Errors =====
    error ZeroAddress();
    error ZeroAmount();
    error InsufficientBalance();
    error InsufficientAllowance();
    error TransferFailed();
    error MintingDisabled();
    error BurningDisabled();
    error StakingNotActive();
    error StakingAlreadyActive();
    error InvalidDuration();
    error ProposalNotFound();
    error VotingEnded();
    error AlreadyVoted();
    error InsufficientVotingPower();
    error VestingNotStarted();
    error VestingAlreadyReleased();
    error Unauthorized();
    error ContractPaused();
    error AccountBlacklisted();
}
