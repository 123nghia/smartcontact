// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./ITokenHub.sol";

/**
 * @title TokenHubV2
 * @dev Utility & Governance Token for Exchange Listing (Default Mint, Burn Allowed)
 * @notice This is a utility and governance token designed for exchange listing
 */
contract TokenHubV2 is ERC20, ERC20Burnable, AccessControl, Pausable, ITokenHub {
    
    // ===== ROLES =====
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    
    // ===== TOKEN INFORMATION =====
    uint8 private constant DECIMALS = 18;
    uint256 private constant TOTAL_SUPPLY = 100_000_000 * 10**DECIMALS; // 100,000,000 THD
    
    // ===== STATE VARIABLES =====
    bool public burningEnabled = true;
    uint256 public totalBurned = 0;
    
    // Events and Errors are defined in ITokenHub interface
    
    // ===== MODIFIERS =====
    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not admin");
        _;
    }
    
    modifier onlyBurner() {
        require(hasRole(BURNER_ROLE, msg.sender), "Caller is not burner");
        _;
    }
    
    modifier whenBurningEnabled() {
        if (!burningEnabled) revert BurningDisabled();
        _;
    }
    
    // ===== CONSTRUCTOR =====
    constructor(address admin) ERC20("Token Hub", "THD") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(BURNER_ROLE, admin);
        
        // Mint total supply to admin
        _mint(admin, TOTAL_SUPPLY);
    }
    
    // ===== PUBLIC VIEW FUNCTIONS =====
    
    /**
     * @dev Returns the number of decimals used to get its user representation
     */
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }
    
    /**
     * @dev Returns the total supply of tokens
     */
    function totalSupply() public pure override(ERC20, IERC20) returns (uint256) {
        return TOTAL_SUPPLY;
    }
    
    /**
     * @dev Returns comprehensive token information
     */
    function getTokenInfo() external view returns (
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 totalSupply_,
        uint256 totalBurned_,
        bool mintingEnabled_,
        bool burningEnabled_
    ) {
        return (
            name(),
            symbol(),
            decimals(),
            totalSupply(),
            totalBurned,
            true, // mintingEnabled - default ERC20 minting available
            burningEnabled
        );
    }
    
    // ===== BURNING FUNCTIONS =====
    
    /**
     * @dev Burn tokens from caller's balance
     */
    function burn(uint256 amount) public override(ERC20Burnable, ITokenHub) whenBurningEnabled whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        if (balanceOf(msg.sender) < amount) revert InsufficientBalance();
        
        totalBurned += amount;
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }
    
    /**
     * @dev Burn tokens from specified account (only burner role)
     */
    function burnFrom(address account, uint256 amount) public override(ERC20Burnable, ITokenHub) whenBurningEnabled whenNotPaused {
        if (account == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (balanceOf(account) < amount) revert InsufficientBalance();
        
        uint256 currentAllowance = allowance(account, msg.sender);
        if (currentAllowance < amount) revert InsufficientAllowance();
        
        _approve(account, msg.sender, currentAllowance - amount);
        totalBurned += amount;
        _burn(account, amount);
        emit TokensBurned(account, amount);
    }
    
    /**
     * @dev Toggle burning on/off (only admin)
     */
    function toggleBurning() external onlyAdmin {
        burningEnabled = !burningEnabled;
        emit BurningToggled(burningEnabled);
    }
    
    // ===== PAUSE FUNCTIONS =====
    
    /**
     * @dev Pause the contract (only admin)
     */
    function pause() external onlyAdmin {
        _pause();
    }
    
    /**
     * @dev Unpause the contract (only admin)
     */
    function unpause() external onlyAdmin {
        _unpause();
    }
    
    // ===== ROLE MANAGEMENT =====
    
    /**
     * @dev Grant burner role to address (only admin)
     */
    function grantBurnerRole(address account) external onlyAdmin {
        _grantRole(BURNER_ROLE, account);
    }
    
    /**
     * @dev Revoke burner role from address (only admin)
     */
    function revokeBurnerRole(address account) external onlyAdmin {
        _revokeRole(BURNER_ROLE, account);
    }
    
    // ===== HOOKS =====
    
    /**
     * @dev Hook that is called before any transfer of tokens
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
    
    /**
     * @dev Hook that is called after any transfer of tokens
     */
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        super._afterTokenTransfer(from, to, amount);
    }
}