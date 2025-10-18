// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Test Token Interface
/// @notice Interface chính cho Test Token ecosystem
interface ITestToken is IERC20 {
    // ===== Events =====
    event TokensMinted(address indexed to, uint256 amount, string purpose);
    event TokensBurned(address indexed from, uint256 amount, string purpose);
    event TokensTransferred(address indexed from, address indexed to, uint256 amount);
    event StakingStarted(address indexed user, uint256 amount, uint256 duration);
    event StakingEnded(address indexed user, uint256 amount, uint256 reward);
    event VoteCast(address indexed voter, uint256 proposalId, bool support, uint256 weight);
    event ProposalCreated(uint256 indexed proposalId, address proposer, string description);
    event BuybackExecuted(uint256 amount, uint256 price);
    event BurnExecuted(uint256 amount);
    event VestingScheduleCreated(address indexed beneficiary, uint256 amount, string category);
    event TokensReleased(address indexed beneficiary, uint256 amount);

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
    error Blacklisted();
}
