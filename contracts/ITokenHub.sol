// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Token Hub Interface
/// @notice Interface cho Simple ERC-20 Token
interface ITokenHub is IERC20 {
    // ===== Events =====
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    event MintingToggled(bool enabled);
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

    // ===== Minting Functions =====
    function mint(address to, uint256 amount) external;
    function toggleMinting() external;

    // ===== Burning Functions =====
    function burn(uint256 amount) external;
    function burnFrom(address account, uint256 amount) external;
    function toggleBurning() external;

    // ===== Pause Functions =====
    function pause() external;
    function unpause() external;

    // ===== Role Management =====
    function grantMinterRole(address account) external;
    function grantBurnerRole(address account) external;
    function revokeMinterRole(address account) external;
    function revokeBurnerRole(address account) external;

    // ===== Token Allocation Constants (Reference Only) =====
    function TEAM_ALLOCATION() external view returns (uint256);
    function NODE_OG_ALLOCATION() external view returns (uint256);
    function LIQUIDITY_ALLOCATION() external view returns (uint256);
    function COMMUNITY_ALLOCATION() external view returns (uint256);
    function STAKING_ALLOCATION() external view returns (uint256);
    function ECOSYSTEM_ALLOCATION() external view returns (uint256);
    function TREASURY_ALLOCATION() external view returns (uint256);

    // ===== State Variables =====
    function mintingEnabled() external view returns (bool);
    function burningEnabled() external view returns (bool);
    function totalBurned() external view returns (uint256);

    // ===== Errors =====
    error ZeroAddress();
    error ZeroAmount();
    error InsufficientBalance();
    error InsufficientAllowance();
    error MintingDisabled();
    error BurningDisabled();
}