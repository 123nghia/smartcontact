// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title Staking Interface
/// @notice Interface cho staking & rewards system
interface IStaking {
    // ===== Structs =====
    struct StakeInfo {
        uint256 amount;             // Số token đang stake
        uint256 startTime;          // Thời gian bắt đầu stake
        uint256 duration;           // Thời gian stake (seconds)
        uint256 rewardRate;         // Tỷ lệ reward (APY)
        bool active;                // Trạng thái stake
    }

    struct PoolInfo {
        uint256 totalStaked;        // Tổng số token đang stake
        uint256 rewardRate;         // Tỷ lệ reward hiện tại
        uint256 lastUpdateTime;     // Thời gian cập nhật cuối
        uint256 totalRewards;       // Tổng reward đã phân phối
    }

    // ===== Events =====
    event Staked(address indexed user, uint256 amount, uint256 duration);
    event Unstaked(address indexed user, uint256 amount, uint256 reward);
    event RewardClaimed(address indexed user, uint256 amount);
    event PoolUpdated(uint256 newRewardRate, uint256 totalStaked);

    // ===== Functions =====
    function stake(uint256 amount, uint256 duration) external;
    function unstake() external;
    function claimReward() external;
    function emergencyUnstake() external;
    
    function getStakeInfo(address user) external view returns (StakeInfo memory);
    function getPoolInfo() external view returns (PoolInfo memory);
    function getPendingReward(address user) external view returns (uint256);
    function getStakingPower(address user) external view returns (uint256);
    function getVIPLevel(address user) external view returns (uint8);
}
