// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title Test Token Errors Interface
/// @notice Custom errors cho TestToken (tiết kiệm gas)
interface ITestTokenErrors {
    error BlacklistedSender(address sender);
    error BlacklistedRecipient(address recipient);
    error BlacklistedOwner(address owner);
    error ZeroAddress();
    error CannotRenounceLastAdmin();
    error Unauthorized();
}