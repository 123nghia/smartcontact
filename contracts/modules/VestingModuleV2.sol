// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../TokenHubV2.sol";

/// @title Vesting Module V2
/// @notice Handles token vesting with cliff and linear release
/// @dev Library-style contract for vesting functionality
contract VestingModuleV2 {
    // Vesting Structures
    struct VestingSchedule {
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 startTime;
        uint256 cliffDuration;
        uint256 vestingDuration;
        bool isActive;
    }
    
    // Events
    event VestedTokensReleased(address indexed beneficiary, uint256 amount);
    
    // Custom Errors
    error VestingNotActive();
    error NoTokensToRelease();
    error InvalidVestingParameters();
    
    // Vesting Functions
    function mintForAllocation(
        TokenHubV2 token,
        address beneficiary,
        uint256 amount,
        uint256 cliffDuration,
        uint256 vestingDuration,
        string memory reason
    ) external {
        if (beneficiary == address(0)) revert("Zero address");
        if (amount == 0) revert("Zero amount");
        
        // This would need to be implemented in the main contract
        // For now, we just mint tokens
        token.mint(beneficiary, amount, reason);
    }
    
    function releaseVestedTokens(
        TokenHubV2 token,
        address beneficiary,
        VestingSchedule memory schedule
    ) external {
        if (!schedule.isActive) revert("Vesting not active");
        
        uint256 releasableAmount = getReleasableAmount(schedule);
        if (releasableAmount == 0) revert("No tokens to release");
        
        schedule.releasedAmount += releasableAmount;
        
        // Transfer tokens from contract to beneficiary
        token.transfer(beneficiary, releasableAmount);
        
        emit VestedTokensReleased(beneficiary, releasableAmount);
    }
    
    function getReleasableAmount(VestingSchedule memory schedule) public view returns (uint256) {
        if (!schedule.isActive) return 0;
        
        uint256 currentTime = block.timestamp;
        
        // Check if cliff period has passed
        if (currentTime < schedule.startTime + schedule.cliffDuration) {
            return 0;
        }
        
        // Calculate vested amount
        uint256 vestingEndTime = schedule.startTime + schedule.vestingDuration;
        uint256 vestedAmount;
        
        if (currentTime >= vestingEndTime) {
            // Fully vested
            vestedAmount = schedule.totalAmount;
        } else {
            // Partially vested
            uint256 vestingElapsed = currentTime - (schedule.startTime + schedule.cliffDuration);
            uint256 vestingDuration = schedule.vestingDuration - schedule.cliffDuration;
            vestedAmount = (schedule.totalAmount * vestingElapsed) / vestingDuration;
        }
        
        return vestedAmount - schedule.releasedAmount;
    }
    
    function getVestingInfo(VestingSchedule memory schedule) external view returns (
        uint256 totalAmount,
        uint256 releasedAmount,
        uint256 startTime,
        uint256 cliffDuration,
        uint256 vestingDuration,
        bool isActive,
        uint256 releasableAmount
    ) {
        return (
            schedule.totalAmount,
            schedule.releasedAmount,
            schedule.startTime,
            schedule.cliffDuration,
            schedule.vestingDuration,
            schedule.isActive,
            getReleasableAmount(schedule)
        );
    }
}
