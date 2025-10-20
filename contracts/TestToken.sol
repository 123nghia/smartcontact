// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./ITestToken.sol";

/// @title Test Token - ERC-20 Utility & Governance Token
/// @notice Utility token with full features
/// @dev Compliant with 100M total supply
contract TestToken is ERC20, ERC20Burnable, Pausable, AccessControl, ReentrancyGuard, ITestToken {
    uint256 public constant TOTAL_SUPPLY = 100_000_000 * 10**18;
    uint256 public constant MAX_SUPPLY = 150_000_000 * 10**18;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    bytes32 public constant STAKING_ROLE = keccak256("STAKING_ROLE");
    bytes32 public constant VESTING_ROLE = keccak256("VESTING_ROLE");
    bytes32 public constant BUYBACK_ROLE = keccak256("BUYBACK_ROLE");
    bool public mintingEnabled = true;
    bool public burningEnabled = true;
    uint256 public totalBurned;
    uint256 public totalMinted;
    
    address public vestingContract;
    address public stakingContract;
    address public governanceContract;
    address public buybackContract;
    
    mapping(address => bool) public blacklisted;
    mapping(address => uint256) public feeDiscount;
    
    constructor(address admin) ERC20("Test Token", "TEST") {
        if (admin == address(0)) revert ZeroAddress();
        
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(MINTER_ROLE, admin);
        _setupRole(BURNER_ROLE, admin);
        _setupRole(PAUSER_ROLE, admin);
        _setupRole(GOVERNANCE_ROLE, admin);
        _setupRole(STAKING_ROLE, admin);
        _setupRole(VESTING_ROLE, admin);
        _setupRole(BUYBACK_ROLE, admin);
        
        _mint(admin, TOTAL_SUPPLY);
        totalMinted = TOTAL_SUPPLY;
    }
    
    function mint(address to, uint256 amount, string calldata purpose) 
        external 
        onlyRole(MINTER_ROLE)
        whenNotPaused 
    {
        if (!mintingEnabled) revert MintingDisabled();
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (blacklisted[to]) revert Blacklisted();
        if (totalSupply() + amount > MAX_SUPPLY) revert("Exceeds max supply");
        
        _mint(to, amount);
        totalMinted += amount;
        emit TokensMinted(to, amount, purpose);
    }
    
    function burn(uint256 amount) public override(ERC20Burnable, ITestToken) {
        if (!burningEnabled) revert BurningDisabled();
        if (blacklisted[_msgSender()]) revert Blacklisted();
        
        super.burn(amount);
        totalBurned += amount;
        emit TokensBurned(_msgSender(), amount, "User burn");
    }
    
    function burnFrom(address account, uint256 amount) public override(ERC20Burnable, ITestToken) {
        if (!burningEnabled) revert BurningDisabled();
        if (blacklisted[account]) revert Blacklisted();
        if (blacklisted[_msgSender()]) revert Blacklisted();
        
        super.burnFrom(account, amount);
        totalBurned += amount;
        emit TokensBurned(account, amount, "Burn from");
    }
    
    function transfer(address to, uint256 amount) public override(ERC20, IERC20) whenNotPaused returns (bool) {
        if (blacklisted[_msgSender()]) revert Blacklisted();
        if (blacklisted[to]) revert Blacklisted();
        
        bool success = super.transfer(to, amount);
        if (success) {
            emit TokensTransferred(_msgSender(), to, amount);
        }
        return success;
    }
    
    function transferFrom(address from, address to, uint256 amount) public override(ERC20, IERC20) whenNotPaused returns (bool) {
        if (blacklisted[from]) revert Blacklisted();
        if (blacklisted[to]) revert Blacklisted();
        if (blacklisted[_msgSender()]) revert Blacklisted();
        
        return super.transferFrom(from, to, amount);
    }
    
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    function toggleMinting() external onlyRole(DEFAULT_ADMIN_ROLE) {
        mintingEnabled = !mintingEnabled;
    }
    
    function toggleBurning() external onlyRole(DEFAULT_ADMIN_ROLE) {
        burningEnabled = !burningEnabled;
    }
    
    function setBlacklisted(address account, bool status) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (account == address(0)) revert ZeroAddress();
        blacklisted[account] = status;
    }
    
    function setFeeDiscount(address account, uint256 discount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (account == address(0)) revert ZeroAddress();
        if (discount > 100) revert("Invalid discount");
        feeDiscount[account] = discount;
    }
    
    function setVestingContract(address _vesting) external onlyRole(DEFAULT_ADMIN_ROLE) {
        vestingContract = _vesting;
    }
    
    function setStakingContract(address _staking) external onlyRole(DEFAULT_ADMIN_ROLE) {
        stakingContract = _staking;
    }
    
    function setGovernanceContract(address _governance) external onlyRole(DEFAULT_ADMIN_ROLE) {
        governanceContract = _governance;
    }
    
    function setBuybackContract(address _buyback) external onlyRole(DEFAULT_ADMIN_ROLE) {
        buybackContract = _buyback;
    }
    
    function getTokenInfo() external view returns (
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 totalSupply_,
        uint256 maxSupply_,
        uint256 totalMinted_,
        uint256 totalBurned_,
        bool mintingEnabled_,
        bool burningEnabled_
    ) {
        return (
            "Test Token",
            "TEST",
            18,
            totalSupply(),
            MAX_SUPPLY,
            totalMinted,
            totalBurned,
            mintingEnabled,
            burningEnabled
        );
    }
    
    function getAccountInfo(address account) external view returns (
        uint256 balance,
        uint256 allowance_,
        bool isBlacklisted_,
        uint256 feeDiscount_
    ) {
        return (
            balanceOf(account),
            allowance(account, _msgSender()),
            blacklisted[account],
            feeDiscount[account]
        );
    }
}
