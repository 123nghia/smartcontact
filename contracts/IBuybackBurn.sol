// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title Buyback & Burn Interface
/// @notice Interface cho buyback & burn mechanism
interface IBuybackBurn {
    // ===== Structs =====
    struct BuybackInfo {
        uint256 totalBought;        // Tổng số token đã mua
        uint256 totalBurned;        // Tổng số token đã burn
        uint256 lastBuybackTime;    // Thời gian buyback cuối
        uint256 buybackAmount;      // Số token mua mỗi lần
        uint256 burnAmount;         // Số token burn mỗi lần
        bool autoMode;              // Chế độ tự động
    }

    // ===== Events =====
    event BuybackExecuted(uint256 amount, uint256 price, uint256 timestamp);
    event BurnExecuted(uint256 amount, uint256 timestamp);
    event BuybackConfigUpdated(uint256 newAmount, uint256 newInterval);
    event AutoModeToggled(bool enabled);

    // ===== Functions =====
    function executeBuyback() external;
    function executeBurn(uint256 amount) external;
    function setBuybackAmount(uint256 amount) external;
    function setBuybackInterval(uint256 interval) external;
    function toggleAutoMode() external;
    function emergencyWithdraw() external;
    
    function getBuybackInfo() external view returns (BuybackInfo memory);
    function getNextBuybackTime() external view returns (uint256);
    function getBuybackPrice() external view returns (uint256);
    function getTotalBurned() external view returns (uint256);
    function getTotalBought() external view returns (uint256);
    function isAutoMode() external view returns (bool);
}
