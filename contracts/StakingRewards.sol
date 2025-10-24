// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StakingRewards is Ownable, ReentrancyGuard {
    IERC20 public immutable token;
    
    enum Lock { Flex, Short, Mid, Long }  // 0d, 30d, 90d, 180d
    enum Tier { None, Bronze, Silver, Gold, Platinum }
    
    struct Stake {
        uint96 amount;
        uint32 start;
        uint32 lastClaim;
        uint32 unlock;
        Lock lock;
        bool active;
    }
    
    struct Proposal {
        uint128 forVotes;
        uint128 againstVotes;
        uint32 end;
        bool executed;
        mapping(address => bool) voted;
    }
    
    mapping(address => Stake) public stakes;
    mapping(Lock => uint32) public lockDays;      // Lock duration
    mapping(Lock => uint16) public apy;            // APY in basis points
    mapping(Tier => uint96) public tierMin;        // Min stake for tier
    mapping(Tier => uint16) public tierFee;        // Trading fee (bp)
    mapping(Tier => uint8) public tierVote;        // Vote weight
    mapping(uint256 => Proposal) public proposals;
    
    uint256 public totalStaked;
    uint256 public rewardPool;
    uint256 public propCount;
    
    uint256 private constant BP = 10000;
    uint256 private constant YEAR = 365 days;
    uint256 private constant PENALTY = 2000;  // 20%
    uint256 private constant VOTE_PERIOD = 7 days;
    uint256 private constant MIN_PROP_STAKE = 100_000e18;
    
    event Staked(address indexed user, uint256 amount, Lock lock);
    event Unstaked(address indexed user, uint256 amount, uint256 penalty);
    event Claimed(address indexed user, uint256 reward);
    event Proposed(uint256 indexed id, address indexed proposer);
    event Voted(uint256 indexed id, address indexed voter, bool support);
    
    constructor(address _token) {
        require(_token != address(0), "Zero address");
        token = IERC20(_token);
        
        // Lock periods & APY
        (lockDays[Lock.Flex], apy[Lock.Flex]) = (0, 500);      // 0d, 5%
        (lockDays[Lock.Short], apy[Lock.Short]) = (30, 1000);  // 30d, 10%
        (lockDays[Lock.Mid], apy[Lock.Mid]) = (90, 1500);      // 90d, 15%
        (lockDays[Lock.Long], apy[Lock.Long]) = (180, 2500);   // 180d, 25%
        
        // Tiers: minStake, fee (bp), voteWeight
        (tierMin[Tier.Bronze], tierFee[Tier.Bronze], tierVote[Tier.Bronze]) = (10_000e18, 80, 1);
        (tierMin[Tier.Silver], tierFee[Tier.Silver], tierVote[Tier.Silver]) = (50_000e18, 60, 2);
        (tierMin[Tier.Gold], tierFee[Tier.Gold], tierVote[Tier.Gold]) = (200_000e18, 40, 5);
        (tierMin[Tier.Platinum], tierFee[Tier.Platinum], tierVote[Tier.Platinum]) = (1_000_000e18, 20, 10);
    }
    
    // ========== STAKING ==========
    
    function stake(uint256 amt, Lock lock) external nonReentrant {
        require(amt > 0 && !stakes[msg.sender].active, "Invalid");
        
        uint32 unlock = uint32(block.timestamp + lockDays[lock] * 1 days);
        stakes[msg.sender] = Stake(uint96(amt), uint32(block.timestamp), uint32(block.timestamp), unlock, lock, true);
        totalStaked += amt;
        
        require(token.transferFrom(msg.sender, address(this), amt), "Transfer failed");
        emit Staked(msg.sender, amt, lock);
    }
    
    function addStake(uint256 amt) external nonReentrant {
        Stake storage s = stakes[msg.sender];
        require(amt > 0 && s.active, "Invalid");
        
        _claim(msg.sender);
        s.amount += uint96(amt);
        totalStaked += amt;
        
        require(token.transferFrom(msg.sender, address(this), amt), "Transfer failed");
        emit Staked(msg.sender, amt, s.lock);
    }
    
    function unstake(uint256 amt) external nonReentrant {
        Stake storage s = stakes[msg.sender];
        require(amt > 0 && amt <= s.amount && s.active, "Invalid");
        
        _claim(msg.sender);
        
        uint256 penalty = 0;
        if (block.timestamp < s.unlock) {
            penalty = (amt * PENALTY) / BP;
            rewardPool += penalty;
        }
        
        uint256 transfer = amt - penalty;
        s.amount -= uint96(amt);
        totalStaked -= amt;
        
        if (s.amount == 0) s.active = false;
        
        require(token.transfer(msg.sender, transfer), "Transfer failed");
        emit Unstaked(msg.sender, transfer, penalty);
    }
    
    function claimReward() external nonReentrant {
        _claim(msg.sender);
    }
    
    function _claim(address user) private {
        Stake storage s = stakes[user];
        if (!s.active) return;
        
        uint256 reward = (s.amount * apy[s.lock] * (block.timestamp - s.lastClaim)) / (BP * YEAR);
        if (reward == 0) return;
        
        require(rewardPool >= reward, "Insufficient pool");
        s.lastClaim = uint32(block.timestamp);
        rewardPool -= reward;
        
        require(token.transfer(user, reward), "Transfer failed");
        emit Claimed(user, reward);
    }
    
    function fundRewards(uint256 amt) external onlyOwner {
        rewardPool += amt;
        require(token.transferFrom(msg.sender, address(this), amt), "Transfer failed");
    }
    
    // ========== TIERS ==========
    
    function getTier(address user) public view returns (Tier) {
        uint256 amt = stakes[user].active ? stakes[user].amount : 0;
        if (amt >= tierMin[Tier.Platinum]) return Tier.Platinum;
        if (amt >= tierMin[Tier.Gold]) return Tier.Gold;
        if (amt >= tierMin[Tier.Silver]) return Tier.Silver;
        if (amt >= tierMin[Tier.Bronze]) return Tier.Bronze;
        return Tier.None;
    }
    
    function getTierInfo(Tier tier) external view returns (uint256 minStake, uint256 fee, uint256 vote, bool launchpad) {
        return (tierMin[tier], tierFee[tier], tierVote[tier], tier >= Tier.Gold);
    }
    
    // ========== GOVERNANCE ==========
    
    function propose(string calldata desc) external returns (uint256) {
        require(stakes[msg.sender].amount >= MIN_PROP_STAKE, "Low stake");
        
        uint256 id = propCount++;
        proposals[id].end = uint32(block.timestamp + VOTE_PERIOD);
        
        emit Proposed(id, msg.sender);
        return id;
    }
    
    function vote(uint256 id, bool support) external {
        Proposal storage p = proposals[id];
        require(block.timestamp <= p.end && !p.voted[msg.sender] && stakes[msg.sender].active, "Invalid");
        
        uint256 power = stakes[msg.sender].amount * tierVote[getTier(msg.sender)];
        
        if (support) p.forVotes += uint128(power);
        else p.againstVotes += uint128(power);
        
        p.voted[msg.sender] = true;
        emit Voted(id, msg.sender, support);
    }
    
    function execute(uint256 id) external onlyOwner {
        Proposal storage p = proposals[id];
        require(block.timestamp > p.end && !p.executed && p.forVotes > p.againstVotes, "Invalid");
        p.executed = true;
    }
    
    // ========== VIEWS ==========
    
    function pending(address user) external view returns (uint256) {
        Stake memory s = stakes[user];
        if (!s.active) return 0;
        return (s.amount * apy[s.lock] * (block.timestamp - s.lastClaim)) / (BP * YEAR);
    }
    
    function getStake(address user) external view returns (
        uint256 amount,
        uint256 start,
        uint256 unlock,
        Lock lock,
        Tier tier,
        bool active
    ) {
        Stake memory s = stakes[user];
        return (s.amount, s.start, s.unlock, s.lock, getTier(user), s.active);
    }
    
    function getProposal(uint256 id) external view returns (uint256 forVotes, uint256 against, uint256 end, bool executed) {
        Proposal storage p = proposals[id];
        return (p.forVotes, p.againstVotes, p.end, p.executed);
    }
    
    // ========== ADMIN ==========
    
    function setAPY(Lock lock, uint16 newAPY) external onlyOwner {
        require(newAPY <= 10000, "Too high");
        apy[lock] = newAPY;
    }
    
    function setTier(Tier tier, uint96 min, uint16 fee, uint8 voteWeight) external onlyOwner {
        tierMin[tier] = min;
        tierFee[tier] = fee;
        tierVote[tier] = voteWeight;
    }
    
    function emergencyWithdraw() external onlyOwner {
        token.transfer(owner(), token.balanceOf(address(this)));
    }
}