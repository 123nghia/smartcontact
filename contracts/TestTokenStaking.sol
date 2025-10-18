// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./ITestToken.sol";
import "./IStaking.sol";

/// @title Test Token Staking Contract
/// @notice Staking & rewards system với VIP tier system
/// @dev Hỗ trợ multiple staking pools và APY rewards
contract TestTokenStaking is AccessControl, ReentrancyGuard, IStaking {
    // ===== Roles =====
    bytes32 public constant STAKING_MANAGER_ROLE = keccak256("STAKING_MANAGER_ROLE");
    
    // ===== State Variables =====
    ITestToken public immutable testToken;
    mapping(address => StakeInfo) public stakeInfo;
    PoolInfo public poolInfo;
    
    // ===== VIP System =====
    uint256[] public vipThresholds = [1000, 5000, 10000, 50000, 100000]; // THB amounts
    uint256[] public vipRewardRates = [5, 8, 12, 18, 25]; // APY percentages
    
    // ===== Constants =====
    uint256 public constant MIN_STAKE_AMOUNT = 100 * 10**18; // 100 THB
    uint256 public constant MAX_STAKE_DURATION = 365 days;
    uint256 public constant MIN_STAKE_DURATION = 30 days;
    
    constructor(address _testToken, address admin) {
        if (_testToken == address(0)) revert ITestToken.ZeroAddress();
        if (admin == address(0)) revert ITestToken.ZeroAddress();
        
        testToken = ITestToken(_testToken);
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(STAKING_MANAGER_ROLE, admin);
        
        // Initialize pool
        poolInfo = PoolInfo({
            totalStaked: 0,
            rewardRate: 10, // 10% APY default
            lastUpdateTime: block.timestamp,
            totalRewards: 0
        });
    }
    
    // ===== Staking Functions =====
    function stake(uint256 amount, uint256 duration) external nonReentrant {
        if (amount < MIN_STAKE_AMOUNT) revert("Amount too low");
        if (duration < MIN_STAKE_DURATION || duration > MAX_STAKE_DURATION) revert ITestToken.InvalidDuration();
        if (stakeInfo[_msgSender()].active) revert ITestToken.StakingAlreadyActive();
        
        // Transfer tokens to contract
        testToken.transferFrom(_msgSender(), address(this), amount);
        
        // Calculate reward rate based on VIP level
        uint256 rewardRate = _calculateRewardRate(amount, duration);
        
        // Create stake info
        stakeInfo[_msgSender()] = StakeInfo({
            amount: amount,
            startTime: block.timestamp,
            duration: duration,
            rewardRate: rewardRate,
            active: true
        });
        
        // Update pool info
        poolInfo.totalStaked += amount;
        poolInfo.lastUpdateTime = block.timestamp;
        
        emit Staked(_msgSender(), amount, duration);
    }
    
    function unstake() external nonReentrant {
        StakeInfo storage userStake = stakeInfo[_msgSender()];
        if (!userStake.active) revert ITestToken.StakingNotActive();
        
        uint256 reward = getPendingReward(_msgSender());
        uint256 totalAmount = userStake.amount + reward;
        
        // Store amount before reset for event
        uint256 stakedAmount = userStake.amount;
        
        // Update pool info
        poolInfo.totalStaked -= userStake.amount;
        poolInfo.totalRewards += reward;
        poolInfo.lastUpdateTime = block.timestamp;
        
        // Reset user stake
        userStake.active = false;
        userStake.amount = 0;
        userStake.startTime = 0;
        userStake.duration = 0;
        userStake.rewardRate = 0;
        
        // Transfer tokens back
        testToken.transfer(_msgSender(), totalAmount);
        
        emit Unstaked(_msgSender(), stakedAmount, reward);
    }
    
    function claimReward() external nonReentrant {
        StakeInfo storage userStake = stakeInfo[_msgSender()];
        if (!userStake.active) revert ITestToken.StakingNotActive();
        
        uint256 reward = getPendingReward(_msgSender());
        if (reward == 0) revert("No reward to claim");
        
        // Update pool info
        poolInfo.totalRewards += reward;
        poolInfo.lastUpdateTime = block.timestamp;
        
        // Reset start time to prevent double claiming
        userStake.startTime = block.timestamp;
        
        // Transfer reward
        testToken.transfer(_msgSender(), reward);
        
        emit RewardClaimed(_msgSender(), reward);
    }
    
    function emergencyUnstake() external nonReentrant {
        StakeInfo storage userStake = stakeInfo[_msgSender()];
        if (!userStake.active) revert ITestToken.StakingNotActive();
        
        // Only return principal, no rewards
        uint256 amount = userStake.amount;
        
        // Update pool info
        poolInfo.totalStaked -= amount;
        poolInfo.lastUpdateTime = block.timestamp;
        
        // Reset user stake
        userStake.active = false;
        userStake.amount = 0;
        userStake.startTime = 0;
        userStake.duration = 0;
        userStake.rewardRate = 0;
        
        // Transfer tokens back
        testToken.transfer(_msgSender(), amount);
        
        emit Unstaked(_msgSender(), amount, 0);
    }
    
    // ===== Admin Functions =====
    function setRewardRate(uint256 newRate) external onlyRole(STAKING_MANAGER_ROLE) {
        poolInfo.rewardRate = newRate;
        poolInfo.lastUpdateTime = block.timestamp;
        emit PoolUpdated(newRate, poolInfo.totalStaked);
    }
    
    function setVIPThresholds(uint256[] calldata thresholds, uint256[] calldata rates) 
        external 
        onlyRole(STAKING_MANAGER_ROLE) 
    {
        if (thresholds.length != rates.length) revert("Arrays length mismatch");
        if (thresholds.length == 0) revert("Empty arrays");
        vipThresholds = thresholds;
        vipRewardRates = rates;
    }
    
    // ===== View Functions =====
    function getStakeInfo(address user) external view returns (StakeInfo memory) {
        return stakeInfo[user];
    }
    
    function getPoolInfo() external view returns (PoolInfo memory) {
        return poolInfo;
    }
    
    function getPendingReward(address user) public view returns (uint256) {
        StakeInfo memory userStake = stakeInfo[user];
        if (!userStake.active) return 0;
        
        uint256 stakingDuration = block.timestamp - userStake.startTime;
        uint256 annualReward = (userStake.amount * userStake.rewardRate) / 100;
        uint256 reward = (annualReward * stakingDuration) / 365 days;
        
        return reward;
    }
    
    function getStakingPower(address user) external view returns (uint256) {
        StakeInfo memory userStake = stakeInfo[user];
        if (!userStake.active) return 0;
        
        // Staking power = amount * duration multiplier
        uint256 durationMultiplier = (userStake.duration * 100) / 365 days;
        return userStake.amount * durationMultiplier / 100;
    }
    
    // ✅ FIXED: Tránh underflow với uint8
    function getVIPLevel(address user) external view returns (uint8) {
        StakeInfo memory userStake = stakeInfo[user];
        if (!userStake.active) return 0;
        
        // Duyệt từ cao xuống thấp, tránh underflow
        for (uint256 i = vipThresholds.length; i > 0; i--) {
            if (userStake.amount >= vipThresholds[i - 1] * 10**18) {
                return uint8(i);
            }
        }
        return 0;
    }
    
    // ===== Internal Functions =====
    function _calculateRewardRate(uint256 amount, uint256 duration) internal view returns (uint256) {
        uint256 baseRate = poolInfo.rewardRate;
        
        // VIP bonus - duyệt từ cao xuống thấp
        for (uint256 i = vipThresholds.length; i > 0; i--) {
            if (amount >= vipThresholds[i - 1] * 10**18) {
                baseRate = vipRewardRates[i - 1];
                break;
            }
        }
        
        // Duration bonus (up to 50% extra for 1 year)
        uint256 durationBonus = (duration * 50) / (365 days);
        return baseRate + durationBonus;
    }
}