// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title Test Token Interface
/// @notice Custom errors và events cho TestToken
interface ITestToken {
    // ===== Errors =====
    error BlacklistedSender(address sender);
    error BlacklistedRecipient(address recipient);
    error BlacklistedOwner(address owner);
    error ZeroAddress();
    error CannotRenounceLastAdmin();
    error Unauthorized();

    // ===== Events =====
    event Blacklisted(address indexed account, bool isBlacklisted);
    event EmergencyWithdraw(address indexed token, address indexed to, uint256 amount);
}