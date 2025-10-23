// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Token Hub Interface
/// @notice Interface cho Utility & Governance Token (Default Mint, Burn Allowed)
interface ITokenHub is IERC20 {
    // ===== Events =====
    event TokensBurned(address indexed from, uint256 amount);
    event BurningToggled(bool enabled);
    event TokensBlacklisted(address indexed account, bool blacklisted);

    // ===== Token Information =====
    function getTokenInfo() external view returns (
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 totalSupply_,
        uint256 totalBurned_,
        bool mintingEnabled_,
        bool burningEnabled_
    );

    // ===== Burning Functions =====
    function burn(uint256 amount) external;
    function burnFrom(address account, uint256 amount) external;
    function toggleBurning() external;

    // ===== Pause Functions =====
    function pause() external;
    function unpause() external;

    // ===== Role Management =====
    function grantBurnerRole(address account) external;
    function revokeBurnerRole(address account) external;

    // ===== State Variables =====
    function burningEnabled() external view returns (bool);
    function totalBurned() external view returns (uint256);

    // ===== Errors =====
    error ZeroAddress();
    error ZeroAmount();
    error InsufficientBalance();
    error InsufficientAllowance();
    error BurningDisabled();
}