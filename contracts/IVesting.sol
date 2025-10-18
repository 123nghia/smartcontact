// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title Vesting Interface
/// @notice Interface cho vesting system theo tokenomic
interface IVesting {
    // ===== Structs =====
    struct VestingSchedule {
        uint256 totalAmount;        // Tổng số token được vest
        uint256 releasedAmount;     // Số token đã release
        uint256 startTime;          // Thời gian bắt đầu vesting
        uint256 cliffDuration;      // Thời gian cliff (seconds)
        uint256 vestingDuration;    // Tổng thời gian vesting (seconds)
        uint256 tgePercentage;      // Phần trăm unlock tại TGE (0-100)
        bool revocable;             // Có thể revoke không
        bool revoked;               // Đã bị revoke chưa
        string category;            // Loại vesting (Team, Node OG, etc.)
    }

    // ===== Events =====
    event VestingScheduleCreated(
        address indexed beneficiary,
        uint256 totalAmount,
        uint256 tgePercentage,
        uint256 cliffDuration,
        uint256 vestingDuration,
        string category
    );
    event TokensReleased(address indexed beneficiary, uint256 amount);
    event VestingRevoked(address indexed beneficiary, uint256 remainingAmount);

    // ===== Functions =====
    function createVestingSchedule(
        address beneficiary,
        uint256 totalAmount,
        uint256 tgePercentage,
        uint256 cliffDuration,
        uint256 vestingDuration,
        string calldata category
    ) external;
    
    function release() external;
    function releaseFor(address beneficiary) external;
    function revokeVesting(address beneficiary) external;
    
    function getVestingSchedule(address beneficiary) external view returns (VestingSchedule memory);
    function getReleasableAmount(address beneficiary) external view returns (uint256);
    function getVestedAmount(address beneficiary) external view returns (uint256);
    function getTotalVested() external view returns (uint256);
    function getTotalReleased() external view returns (uint256);
}
