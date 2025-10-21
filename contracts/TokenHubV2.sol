// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./ITokenHub.sol";

/// @title TokenHub V2 - Modular ERC-20 Token
/// @notice Comprehensive tokenomics token with modular architecture
/// @dev All features in one contract but organized in sections
contract TokenHubV2 is ERC20, ERC20Burnable, Pausable, AccessControl, ReentrancyGuard, ITokenHub {
    // ===== CONSTANTS =====
    uint256 public constant TOTAL_SUPPLY = 100_000_000 * 10**18; // 100M THD
    
    // Allocation Constants
    uint256 public constant TEAM_ALLOCATION = 7_000_000 * 10**18;      // 7%
    uint256 public constant NODE_OG_ALLOCATION = 3_000_000 * 10**18;   // 3%
    uint256 public constant LIQUIDITY_ALLOCATION = 15_000_000 * 10**18; // 15%
    uint256 public constant COMMUNITY_ALLOCATION = 20_000_000 * 10**18; // 20%
    uint256 public constant STAKING_ALLOCATION = 10_000_000 * 10**18;   // 10%
    uint256 public constant ECOSYSTEM_ALLOCATION = 25_000_000 * 10**18; // 25%
    uint256 public constant TREASURY_ALLOCATION = 20_000_000 * 10**18;  // 20%
    
    // Role Constants
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    bytes32 public constant VESTING_ROLE = keccak256("VESTING_ROLE");
    bytes32 public constant STAKING_ROLE = keccak256("STAKING_ROLE");
    bytes32 public constant BUYBACK_ROLE = keccak256("BUYBACK_ROLE");
    bytes32 public constant BLACKLISTER_ROLE = keccak256("BLACKLISTER_ROLE");
    
    // ===== STATE VARIABLES =====
    uint256 public totalBurned;
    uint256 public totalBuybackBurned;
    bool public mintingEnabled = true;
    bool public burningEnabled = true;
    
    // Contract Addresses
    address public vestingContract;
    address public stakingContract;
    address public governanceContract;
    address public buybackContract;
    
    // Blacklist & Fee Discount
    mapping(address => bool) public blacklisted;
    mapping(address => uint256) public feeDiscount;
    
    // VIP Tier System
    mapping(address => uint8) public vipTier;
    mapping(uint8 => uint256) public tierRequirements;
    
    // Vesting System
    struct VestingSchedule {
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 startTime;
        uint256 cliffDuration;
        uint256 vestingDuration;
        bool isActive;
    }
    mapping(address => VestingSchedule) public vestingSchedules;
    
    // Staking System
    struct StakingInfo {
        uint256 stakedAmount;
        uint256 stakingStartTime;
        uint256 lockDuration;
        uint256 lastRewardTime;
        bool isActive;
    }
    mapping(address => StakingInfo) public stakingInfo;
    uint256 public totalStaked;
    uint256 public constant STAKING_APY = 10; // 10% APY
    uint256 public constant SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
    
    // Governance System
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
        bool active;
    }
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(address => uint256) public lastVoteTime;
    
    // Referral System
    struct ReferralInfo {
        address referrer;
        uint256 totalReferred;
        uint256 totalRewards;
        uint256 lastRewardTime;
    }
    mapping(address => address) public referrer;
    mapping(address => uint256) public totalReferred;
    mapping(address => uint256) public referralRewards;
    mapping(address => ReferralInfo) public referralInfo;
    
    // Trade Mining System
    struct TradeRecord {
        uint256 volume;
        uint256 timestamp;
        uint256 rewardRate;
    }
    mapping(address => uint256) public tradeMiningRewards;
    mapping(address => uint256) public lastTradeTime;
    mapping(address => TradeRecord[]) public tradeHistory;
    mapping(address => uint256) public totalTradeVolume;
    uint256 public constant TRADE_MINING_RATE = 1; // 1% of trade volume
    uint256 public constant MIN_TRADE_VOLUME = 100 * 10**18; // 100 THD minimum
    
    // ===== CONSTRUCTOR =====
    constructor(address admin) ERC20("Token Hub", "THD") {
        if (admin == address(0)) revert ZeroAddress();
        
        // Setup roles
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(MINTER_ROLE, admin);
        _setupRole(PAUSER_ROLE, admin);
        _setupRole(GOVERNANCE_ROLE, admin);
        _setupRole(VESTING_ROLE, admin);
        _setupRole(STAKING_ROLE, admin);
        _setupRole(BUYBACK_ROLE, admin);
        _setupRole(BLACKLISTER_ROLE, admin);
        
        // Initialize VIP tier requirements
        tierRequirements[1] = 10_000 * 10**18;   // 10K THD
        tierRequirements[2] = 50_000 * 10**18;   // 50K THD
        tierRequirements[3] = 100_000 * 10**18;  // 100K THD
        tierRequirements[4] = 500_000 * 10**18;  // 500K THD
        tierRequirements[5] = 1_000_000 * 10**18; // 1M THD
        
        // Mint total supply to admin for initial distribution
        _mint(admin, TOTAL_SUPPLY);
        
        emit TokensMinted(admin, TOTAL_SUPPLY, "Initial supply");
    }
    
    // ===== CORE ERC20 FUNCTIONS =====
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override {
        super._beforeTokenTransfer(from, to, amount);
        
        if (paused()) revert ContractPaused();
        if (blacklisted[from] || blacklisted[to]) revert AccountBlacklisted();
    }
    
    function _afterTokenTransfer(address from, address to, uint256 amount) internal override {
        super._afterTokenTransfer(from, to, amount);
        
        // Update VIP tiers
        if (from != address(0)) _updateVIPTier(from);
        if (to != address(0)) _updateVIPTier(to);
        
        emit TokensTransferred(from, to, amount);
    }
    
    // ===== MINTING FUNCTIONS =====
    function mint(address to, uint256 amount, string memory reason) external onlyRole(MINTER_ROLE) {
        if (!mintingEnabled) revert MintingDisabled();
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        
        _mint(to, amount);
        emit TokensMinted(to, amount, reason);
    }
    
    // ===== BURNING FUNCTIONS =====
    function burn(uint256 amount) public override(ERC20Burnable, ITokenHub) {
        if (!burningEnabled) revert BurningDisabled();
        if (amount == 0) revert ZeroAmount();
        
        totalBurned += amount;
        super.burn(amount);
        emit TokensBurned(_msgSender(), amount, "Manual burn");
    }
    
    function burnFrom(address account, uint256 amount) public override(ERC20Burnable, ITokenHub) {
        if (!burningEnabled) revert BurningDisabled();
        if (amount == 0) revert ZeroAmount();
        
        totalBurned += amount;
        super.burnFrom(account, amount);
        emit TokensBurned(account, amount, "Burn from");
    }
    
    // ===== PAUSE FUNCTIONS =====
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    // ===== ADMIN FUNCTIONS =====
    function setMintingEnabled(bool enabled) external onlyRole(DEFAULT_ADMIN_ROLE) {
        mintingEnabled = enabled;
    }
    
    function setBurningEnabled(bool enabled) external onlyRole(DEFAULT_ADMIN_ROLE) {
        burningEnabled = enabled;
    }
    
    function setVestingContract(address _contract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        vestingContract = _contract;
    }
    
    function setStakingContract(address _contract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        stakingContract = _contract;
    }
    
    function setGovernanceContract(address _contract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        governanceContract = _contract;
    }
    
    function setBuybackContract(address _contract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        buybackContract = _contract;
    }
    
    // ===== INTERNAL FUNCTIONS =====
    function _updateVIPTier(address account) internal {
        uint256 balance = balanceOf(account);
        uint8 newTier = 0;
        
        for (uint8 i = 5; i >= 1; i--) {
            if (balance >= tierRequirements[i]) {
                newTier = i;
                break;
            }
        }
        
        if (vipTier[account] != newTier) {
            vipTier[account] = newTier;
            emit VIPTierUpdated(account, newTier);
        }
    }
    
    // ===== VIEW FUNCTIONS =====
    function getTokenInfo() external view returns (
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 totalSupply_,
        uint256 totalBurned_,
        uint256 totalBuybackBurned_,
        bool mintingEnabled_,
        bool burningEnabled_
    ) {
        return (
            name(),
            symbol(),
            decimals(),
            totalSupply(),
            totalBurned,
            totalBuybackBurned,
            mintingEnabled,
            burningEnabled
        );
    }
    
    function getAccountInfo(address account) external view returns (
        uint8 vipTier_,
        uint256 feeDiscount_,
        bool isBlacklisted_
    ) {
        return (
            vipTier[account],
            feeDiscount[account],
            blacklisted[account]
        );
    }
}
