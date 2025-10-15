// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title Test Token Events Interface
/// @notice Events cho TestToken
interface ITestTokenEvents {
    event Blacklisted(address indexed account, bool isBlacklisted);
    event EmergencyWithdraw(address indexed token, address indexed to, uint256 amount);
}