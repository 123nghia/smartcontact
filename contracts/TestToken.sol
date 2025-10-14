// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title TEST Token (BEP-20 Utility)
/// @notice Token tiện ích có Cap/Mint/Burn/Pause/Blacklist/AccessControl
contract TestToken is ERC20, ERC20Burnable, ERC20Capped, Pausable, AccessControl {
    // ===== Roles =====
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant BLACKLISTER_ROLE = keccak256("BLACKLISTER_ROLE");

    // ===== Constants =====
    uint256 private constant CAP = 1_000_000_000 * 10 ** 18;

    // ===== Blacklist =====
    mapping(address => bool) private _blacklisted;

    // ===== Events =====
    event Blacklisted(address indexed account, bool isBlacklisted);

    constructor(address admin)
        ERC20("test", "TEST")
        ERC20Capped(CAP)
    {
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(MINTER_ROLE, admin);
     
        _setupRole(PAUSER_ROLE, admin);
        _setupRole(BLACKLISTER_ROLE, admin);
    }

    // ====== Mint (chỉ MINTER_ROLE, tuân thủ CAP) ======
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    // ====== Pause/Unpause (chỉ PAUSER_ROLE) ======
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ====== Blacklist (chỉ BLACKLISTER_ROLE) ======
    function setBlacklisted(address account, bool value) external onlyRole(BLACKLISTER_ROLE) {
        _blacklisted[account] = value;
        emit Blacklisted(account, value);
    }

    function isBlacklisted(address account) public view returns (bool) {
        return _blacklisted[account];
    }

    // ===== Overrides bắt buộc khi kết hợp nhiều extension =====
    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        require(!_blacklisted[from], "Blacklist: sender");
        require(!_blacklisted[to], "Blacklist: recipient");
        super._beforeTokenTransfer(from, to, amount);
    }

    // Khi dùng ERC20Capped, cần override _mint
    function _mint(address to, uint256 amount)
        internal
        override(ERC20, ERC20Capped)
    {
        super._mint(to, amount);
    }
}
