// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./BlacklistManager.sol";
import "./AdminManager.sol";

/// @title TEST Token (BEP-20 Utility)
/// @notice Token tiện ích có Cap/Mint/Burn/Pause/Blacklist/AccessControl
/// @dev Audit-ready version compatible with OpenZeppelin v4.9.6
contract TestToken is 
    ERC20, 
    ERC20Burnable, 
    ERC20Capped, 
    Pausable, 
    BlacklistManager,
    AdminManager
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 private constant CAP = 1_000_000_000 * 10 ** 18;

    constructor(address admin)
        ERC20("test", "TEST")
        ERC20Capped(CAP)
    {
        _initializeAdmin(admin);
        _setupRole(MINTER_ROLE, admin);
        _setupRole(PAUSER_ROLE, admin);
        _setupRole(BLACKLISTER_ROLE, admin);
    }

    // ====== Mint ======
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        if (to == address(0)) revert ZeroAddress();
        if (_isBlacklistedInternal(to)) revert BlacklistedRecipient(to);
        _mint(to, amount);
    }

    // ====== Pause ======
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ====== Emergency ======
    function emergencyWithdrawToken(
        address token,
        address to,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(token != address(this), "Cannot withdraw native token");
        require(to != address(0), "Invalid recipient");
        
        IERC20(token).transfer(to, amount);
        emit EmergencyWithdraw(token, to, amount);
    }

    // ====== Burn với blacklist ======
    function burn(uint256 amount) public override {
        if (_isBlacklistedInternal(_msgSender())) revert BlacklistedOwner(_msgSender());
        super.burn(amount);
    }

    function burnFrom(address account, uint256 amount) public override {
        if (_isBlacklistedInternal(account)) revert BlacklistedOwner(account);
        if (_isBlacklistedInternal(_msgSender())) revert BlacklistedSender(_msgSender());
        super.burnFrom(account, amount);
    }

    // ====== Approve với blacklist ======
    function approve(address spender, uint256 amount) public override whenNotPaused returns (bool) {
        address owner = _msgSender();
        if (_isBlacklistedInternal(owner)) revert BlacklistedOwner(owner);
        if (_isBlacklistedInternal(spender)) revert BlacklistedRecipient(spender);
        return super.approve(spender, amount);
    }

    function increaseAllowance(address spender, uint256 addedValue) public override whenNotPaused returns (bool) {
        address owner = _msgSender();
        if (_isBlacklistedInternal(owner)) revert BlacklistedOwner(owner);
        if (_isBlacklistedInternal(spender)) revert BlacklistedRecipient(spender);
        return super.increaseAllowance(spender, addedValue);
    }

    function decreaseAllowance(address spender, uint256 subtractedValue) public override whenNotPaused returns (bool) {
        address owner = _msgSender();
        if (_isBlacklistedInternal(owner)) revert BlacklistedOwner(owner);
        return super.decreaseAllowance(spender, subtractedValue);
    }

    // ====== Transfer với pause ======
    function transfer(address to, uint256 amount) public override whenNotPaused returns (bool) {
        return super.transfer(to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) public override whenNotPaused returns (bool) {
        // Kiểm tra blacklist trước
        if (from != address(0) && _isBlacklistedInternal(from)) revert BlacklistedSender(from);
        if (to != address(0) && _isBlacklistedInternal(to)) revert BlacklistedRecipient(to);
        
        return super.transferFrom(from, to, amount);
    }

    // ====== Overrides ======
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        if (from != address(0) && _isBlacklistedInternal(from)) revert BlacklistedSender(from);
        if (to != address(0) && _isBlacklistedInternal(to)) revert BlacklistedRecipient(to);
        
        super._beforeTokenTransfer(from, to, amount);
    }

    function _mint(address account, uint256 amount)
        internal
        override(ERC20, ERC20Capped)
    {
        super._mint(account, amount);
    }

    // ====== Override AccessControl functions ======
    function grantRole(bytes32 role, address account) 
        public 
        override(AccessControl, AdminManager) 
        onlyRole(getRoleAdmin(role)) 
    {
        AdminManager.grantRole(role, account);
    }

    function revokeRole(bytes32 role, address account) 
        public 
        override(AccessControl, AdminManager) 
        onlyRole(getRoleAdmin(role)) 
    {
        AdminManager.revokeRole(role, account);
    }

    function renounceRole(bytes32 role, address account) 
        public 
        override(AccessControl, AdminManager) 
    {
        AdminManager.renounceRole(role, account);
    }

    // ====== View Functions ======
    function isPaused() external view returns (bool) {
        return paused();
    }

    function getTokenInfo() external view returns (
        string memory tokenName,
        string memory tokenSymbol,
        uint8 tokenDecimals,
        uint256 tokenTotalSupply,
        uint256 tokenCap
    ) {
        return (name(), symbol(), decimals(), totalSupply(), cap());
    }

    function hasAnyRole(address account) external view returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, account) ||
               hasRole(MINTER_ROLE, account) ||
               hasRole(PAUSER_ROLE, account) ||
               hasRole(BLACKLISTER_ROLE, account);
    }

    /// @notice Xem số dư và trạng thái của một địa chỉ
    function getAccountInfo(address account) external view returns (
        uint256 balance,
        bool isBlacklistedStatus,
        bool hasAdminRole,
        bool hasMinterRole,
        bool hasPauserRole,
        bool hasBlacklisterRole
    ) {
        return (
            balanceOf(account),
            isBlacklisted(account),
            hasRole(DEFAULT_ADMIN_ROLE, account),
            hasRole(MINTER_ROLE, account),
            hasRole(PAUSER_ROLE, account),
            hasRole(BLACKLISTER_ROLE, account)
        );
    }

    /// @notice Xem số dư của nhiều địa chỉ cùng lúc
    function getBalancesBatch(address[] calldata accounts) external view returns (uint256[] memory) {
        uint256[] memory balances = new uint256[](accounts.length);
        for (uint256 i = 0; i < accounts.length; i++) {
            balances[i] = balanceOf(accounts[i]);
        }
        return balances;
    }

    /// @notice Xem số token còn có thể mint
    function getRemainingMintable() external view returns (uint256) {
        return cap() - totalSupply();
    }
}