// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract TokenVesting is Ownable, ReentrancyGuard {
    IERC20 public immutable token;
    
    enum Category { TeamAdvisors, NodeOG, LiquidityMarket, CommunityMarketing, StakingRewards, EcosystemPartnerships, TreasuryReserve }
    
    struct Schedule {
        uint96 totalAlloc;      // Total tokens for category
        uint32 tgePercent;      // TGE % (basis points)
        uint32 cliffDays;       // Cliff period in days
        uint32 vestingDays;     // Vesting duration in days
        uint32 startTime;       // Vesting start timestamp
    }
    
    struct Beneficiary {
        uint96 allocation;      // Tokens allocated
        uint96 claimed;         // Tokens claimed
        Category category;      // Allocation category
        bool active;            // Active status
    }
    
    mapping(Category => Schedule) public schedules;
    mapping(address => Beneficiary) public beneficiaries;
    mapping(Category => uint256) public allocated;
    
    uint256 public tgeTime;
    uint256 private constant BP = 10000;
    uint256 private constant DAY = 1 days;
    
    event Claimed(address indexed user, uint256 amount);
    event Added(address indexed user, Category category, uint256 amount);
    
    constructor(address _token) {
        require(_token != address(0), "Zero address");
        token = IERC20(_token);
        _initSchedules();
    }
    //option
    // event EmergencyWithdraw(address indexed to, uint256 amount, uint256 timestamp);
    // function emergencyWithdraw(uint256 amount) external onlyOwner {
    //         uint256 balance = token.balanceOf(address(this));
    //         uint256 totalAlloc = 0;
    //         // tính tổng token cần giữ cho vesting (total allocations)
    //         for (uint i = 0; i < 7; i++) {
    //         totalAlloc += uint256(schedules[Category(i)].totalAlloc);
    //         }
    //         require(balance > totalAlloc, "No surplus tokens");
    //         uint256 surplus = balance - totalAlloc;
    //         require(amount <= surplus, "Exceeds surplus");
    //         token.transfer(owner(), amount);
    //         emit EmergencyWithdraw(owner(), amount, block.timestamp);
    // }
    
    function _initSchedules() private {
        schedules[Category.TeamAdvisors] = Schedule(7_000_000e18, 0, 180, 1080, 0);
        schedules[Category.NodeOG] = Schedule(3_000_000e18, 1000, 0, 720, 0);
        schedules[Category.LiquidityMarket] = Schedule(15_000_000e18, 4000, 0, 360, 0);
        schedules[Category.CommunityMarketing] = Schedule(20_000_000e18, 2000, 0, 720, 0);
        schedules[Category.StakingRewards] = Schedule(10_000_000e18, 0, 0, 1080, 0);
        schedules[Category.EcosystemPartnerships] = Schedule(25_000_000e18, 1000, 0, 900, 0);
        schedules[Category.TreasuryReserve] = Schedule(20_000_000e18, 2000, 0, 1440, 0);
    }
    
    function startVesting() external onlyOwner {
        require(tgeTime == 0, "Already started");
        tgeTime = block.timestamp;
        for (uint i = 0; i < 7; i++) {
            schedules[Category(i)].startTime = uint32(block.timestamp);
        }
    }
    
    function addBeneficiary(address user, Category cat, uint256 amount) external onlyOwner {
        require(user != address(0) && amount > 0, "Invalid input");
        require(!beneficiaries[user].active, "Already exists");
        require(allocated[cat] + amount <= schedules[cat].totalAlloc, "Exceeds limit");
        
        beneficiaries[user] = Beneficiary(uint96(amount), 0, cat, true);
        allocated[cat] += amount;
        emit Added(user, cat, amount);
    }
    
    // function batchAdd(address[] calldata users, Category cat, uint256[] calldata amounts) external onlyOwner {
    //     require(users.length == amounts.length, "Length mismatch");
    //     for (uint i = 0; i < users.length; i++) {
    //         this.addBeneficiary(users[i], cat, amounts[i]);
    //     }
    // }
    
    function claimable(address user) public view returns (uint256) {
        Beneficiary memory b = beneficiaries[user];
        if (!b.active || tgeTime == 0) return 0;
        
        Schedule memory s = schedules[b.category];
        uint256 elapsed = block.timestamp - s.startTime;

        if (elapsed < s.cliffDays * DAY) 
            return 0;
        
        uint256 tgeAmt = (b.allocation * s.tgePercent) / BP;
        uint256 vested;
        
        if (elapsed >= s.vestingDays * DAY) {
            vested = b.allocation;
        } else {
            uint256 vestAmt = b.allocation - tgeAmt;
            vested = tgeAmt + (vestAmt * elapsed) / (s.vestingDays * DAY);
        }
        
        return vested > b.claimed ? vested - b.claimed : 0;
    }
    
    function claim() external nonReentrant {
        uint256 amount = claimable(msg.sender);
        require(amount > 0, "Nothing to claim");
        
        beneficiaries[msg.sender].claimed += uint96(amount);
        require(token.transfer(msg.sender, amount), "Transfer failed");
        emit Claimed(msg.sender, amount);
    }
    
    
    
    function deactivate(address user) external onlyOwner {
        beneficiaries[user].active = false;
    }
    
    function getCategoryInfo(Category cat) external view returns (uint256 total, uint256 used, uint256 available) {
        total = schedules[cat].totalAlloc;
        used = allocated[cat];
        available = total - used;
    }
}