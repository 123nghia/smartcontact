// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../TokenHubV2.sol";

/// @title Staking Module V2
/// @notice Handles token staking with rewards and lock periods
/// @dev Library-style contract for staking functionality
contract StakingModuleV2 {
    // Staking Structures
    struct StakingInfo {
        uint256 stakedAmount;
        uint256 stakingStartTime;
        uint256 lockDuration;
        uint256 lastRewardTime;
        bool isActive;
    }
    
    // Events
    event TokensStaked(address indexed staker, uint256 amount, uint256 lockDuration);
    event TokensUnstaked(address indexed staker, uint256 amount);
    event StakingRewardsClaimed(address indexed staker, uint256 amount);
    
    // Custom Errors
    error StakingNotActive();
    error StakingAlreadyActive();
    error InvalidDuration();
    error InsufficientStakedAmount();
    
    // Constants
    uint256 public constant STAKING_APY = 10; // 10% APY
    uint256 public constant SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
    
    // Staking Functions
    function stake(
        TokenHubV2 token,
        address staker,
        uint256 amount,
        uint256 lockDuration,
        StakingInfo memory info,
        uint256 totalStaked
    ) external returns (uint256) {
        if (amount == 0) revert("Zero amount");
        if (lockDuration == 0) revert("Invalid duration");
        if (info.isActive) revert("Staking already active");
        
        // Transfer tokens from user to contract
        token.transferFrom(staker, address(token), amount);
        
        // Create staking info
        info.stakedAmount = amount;
        info.stakingStartTime = block.timestamp;
        info.lockDuration = lockDuration;
        info.lastRewardTime = block.timestamp;
        info.isActive = true;
        
        emit TokensStaked(staker, amount, lockDuration);
        return totalStaked + amount;
    }
    
    function unstake(
        TokenHubV2 token,
        address staker,
        StakingInfo memory info,
        uint256 totalStaked
    ) external returns (uint256) {
        if (!info.isActive) revert("Staking not active");
        
        // Check if lock period has passed
        if (block.timestamp < info.stakingStartTime + info.lockDuration) {
            revert("Lock period not expired");
        }
        
        uint256 stakedAmount = info.stakedAmount;
        uint256 rewards = calculateStakingRewards(info);
        
        // Reset staking info
        info.isActive = false;
        info.stakedAmount = 0;
        
        // Transfer staked tokens back to user
        token.transfer(staker, stakedAmount);
        
        // Mint and transfer rewards
        if (rewards > 0) {
            token.mint(staker, rewards, "Staking rewards");
        }
        
        emit TokensUnstaked(staker, stakedAmount);
        if (rewards > 0) {
            emit StakingRewardsClaimed(staker, rewards);
        }
        
        return totalStaked - stakedAmount;
    }
    
    function claimStakingRewards(
        TokenHubV2 token,
        address staker,
        StakingInfo memory info
    ) external {
        if (!info.isActive) revert("Staking not active");
        
        uint256 rewards = calculateStakingRewards(info);
        if (rewards == 0) return;
        
        // Update last reward time
        info.lastRewardTime = block.timestamp;
        
        // Mint and transfer rewards
        token.mint(staker, rewards, "Staking rewards");
        emit StakingRewardsClaimed(staker, rewards);
    }
    
    function calculateStakingRewards(StakingInfo memory info) public view returns (uint256) {
        if (!info.isActive) return 0;
        
        uint256 timeElapsed = block.timestamp - info.lastRewardTime;
        uint256 annualReward = (info.stakedAmount * STAKING_APY) / 100;
        uint256 rewards = (annualReward * timeElapsed) / SECONDS_PER_YEAR;
        
        return rewards;
    }
    
    function getStakingInfo(StakingInfo memory info) external view returns (
        uint256 stakedAmount,
        uint256 stakingStartTime,
        uint256 lockDuration,
        bool isActive,
        uint256 pendingRewards
    ) {
        return (
            info.stakedAmount,
            info.stakingStartTime,
            info.lockDuration,
            info.isActive,
            calculateStakingRewards(info)
        );
    }
}
