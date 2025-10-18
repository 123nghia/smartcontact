// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./ITestToken.sol";
import "./IVesting.sol";

/// @title Test Token Vesting Contract
/// @notice Quản lý vesting schedule theo tokenomic document
/// @dev Hỗ trợ cliff period, linear vesting, và TGE unlock
contract TestTokenVesting is AccessControl, ReentrancyGuard, IVesting {
    // ===== Roles =====
    bytes32 public constant VESTING_MANAGER_ROLE = keccak256("VESTING_MANAGER_ROLE");
    
    // ===== State Variables =====
    ITestToken public immutable testToken;
    mapping(address => VestingSchedule) public vestingSchedules;
    mapping(string => uint256) public categoryAllocations;
    address[] public beneficiaries;
    
    uint256 public totalVested;
    uint256 public totalReleased;
    
    // ===== Constants =====
    uint256 public constant MONTH_IN_SECONDS = 30 * 24 * 60 * 60; // 30 days
    
    constructor(address _testToken, address admin) {
        if (_testToken == address(0)) revert ITestToken.ZeroAddress();
        if (admin == address(0)) revert ITestToken.ZeroAddress();
        
        testToken = ITestToken(_testToken);
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(VESTING_MANAGER_ROLE, admin);
    }
    
    // ===== Vesting Management =====
    function createVestingSchedule(
        address beneficiary,
        uint256 totalAmount,
        uint256 tgePercentage,
        uint256 cliffDuration,
        uint256 vestingDuration,
        string calldata category
    ) external onlyRole(VESTING_MANAGER_ROLE) {
        if (beneficiary == address(0)) revert ITestToken.ZeroAddress();
        if (totalAmount == 0) revert ITestToken.ZeroAmount();
        if (tgePercentage > 100) revert("Invalid TGE percentage");
        if (vestingSchedules[beneficiary].totalAmount > 0) revert("Vesting already exists");
        
        // Transfer tokens to this contract
        testToken.transferFrom(_msgSender(), address(this), totalAmount);
        
        // Create vesting schedule
        vestingSchedules[beneficiary] = VestingSchedule({
            totalAmount: totalAmount,
            releasedAmount: 0,
            startTime: block.timestamp,
            cliffDuration: cliffDuration,
            vestingDuration: vestingDuration,
            tgePercentage: tgePercentage,
            revocable: true,
            revoked: false,
            category: category
        });
        
        beneficiaries.push(beneficiary);
        totalVested += totalAmount;
        categoryAllocations[category] += totalAmount;
        
        // Release TGE amount if > 0
        if (tgePercentage > 0) {
            uint256 tgeAmount = (totalAmount * tgePercentage) / 100;
            _releaseTokens(beneficiary, tgeAmount);
        }
        
        emit VestingScheduleCreated(
            beneficiary,
            totalAmount,
            tgePercentage,
            cliffDuration,
            vestingDuration,
            category
        );
    }
    
    // ===== Release Functions =====
    function release() external nonReentrant {
        _releaseFor(_msgSender());
    }
    
    function releaseFor(address beneficiary) external onlyRole(VESTING_MANAGER_ROLE) nonReentrant {
        _releaseFor(beneficiary);
    }
    
    function _releaseFor(address beneficiary) internal {
        VestingSchedule storage schedule = vestingSchedules[beneficiary];
        if (schedule.totalAmount == 0) revert("No vesting schedule");
        if (schedule.revoked) revert("Vesting revoked");
        
        uint256 releasableAmount = getReleasableAmount(beneficiary);
        if (releasableAmount == 0) revert("No tokens to release");
        
        _releaseTokens(beneficiary, releasableAmount);
    }
    
    function _releaseTokens(address beneficiary, uint256 amount) internal {
        vestingSchedules[beneficiary].releasedAmount += amount;
        totalReleased += amount;
        
        testToken.transfer(beneficiary, amount);
        emit TokensReleased(beneficiary, amount);
    }
    
    // ===== Revoke Functions =====
    function revokeVesting(address beneficiary) external onlyRole(VESTING_MANAGER_ROLE) {
        VestingSchedule storage schedule = vestingSchedules[beneficiary];
        if (schedule.totalAmount == 0) revert("No vesting schedule");
        if (schedule.revoked) revert("Already revoked");
        if (!schedule.revocable) revert("Not revocable");
        
        schedule.revoked = true;
        uint256 remainingAmount = schedule.totalAmount - schedule.releasedAmount;
        
        if (remainingAmount > 0) {
            testToken.transfer(_msgSender(), remainingAmount);
        }
        
        emit VestingRevoked(beneficiary, remainingAmount);
    }
    
    // ===== View Functions =====
    function getVestingSchedule(address beneficiary) external view returns (VestingSchedule memory) {
        return vestingSchedules[beneficiary];
    }
    
    function getReleasableAmount(address beneficiary) public view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[beneficiary];
        if (schedule.totalAmount == 0 || schedule.revoked) return 0;
        
        uint256 vestedAmount = getVestedAmount(beneficiary);
        return vestedAmount - schedule.releasedAmount;
    }
    
    // ✅ FIXED: Tính đúng TGE + linear vesting
    function getVestedAmount(address beneficiary) public view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[beneficiary];
        if (schedule.totalAmount == 0) return 0;
        
        // Tính TGE amount (đã unlock ngay từ đầu)
        uint256 tgeAmount = (schedule.totalAmount * schedule.tgePercentage) / 100;
        
        // Phần còn lại sẽ vest tuyến tính
        uint256 remainingAmount = schedule.totalAmount - tgeAmount;
        
        uint256 currentTime = block.timestamp;
        uint256 cliffEndTime = schedule.startTime + schedule.cliffDuration;
        
        // Trước cliff: chỉ có TGE amount
        if (currentTime < cliffEndTime) {
            return tgeAmount;
        }
        
        // Sau khi vesting kết thúc: toàn bộ
        uint256 vestingEndTime = schedule.startTime + schedule.vestingDuration;
        if (currentTime >= vestingEndTime) {
            return schedule.totalAmount;
        }
        
        // Tính linear vesting cho phần còn lại
        uint256 vestingDuration = vestingEndTime - cliffEndTime;
        uint256 elapsedTime = currentTime - cliffEndTime;
        uint256 vestedFromLinear = (remainingAmount * elapsedTime) / vestingDuration;
        
        return tgeAmount + vestedFromLinear;
    }
    
    function getTotalVested() external view returns (uint256) {
        return totalVested;
    }
    
    function getTotalReleased() external view returns (uint256) {
        return totalReleased;
    }
    
    function getBeneficiaryCount() external view returns (uint256) {
        return beneficiaries.length;
    }
    
    function getCategoryAllocation(string calldata category) external view returns (uint256) {
        return categoryAllocations[category];
    }
}