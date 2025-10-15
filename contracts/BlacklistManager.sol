// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./ITestToken.sol";

/// @title Blacklist Manager
/// @notice Quản lý blacklist cho token
abstract contract BlacklistManager is AccessControl, ITestToken {
    bytes32 public constant BLACKLISTER_ROLE = keccak256("BLACKLISTER_ROLE");

    mapping(address => bool) private _blacklisted;

    /// @notice Thêm/xóa địa chỉ khỏi blacklist
    function setBlacklisted(address account, bool value) external onlyRole(BLACKLISTER_ROLE) {
        if (account == address(0)) revert ZeroAddress();
        _blacklisted[account] = value;
        emit Blacklisted(account, value);
    }

    /// @notice Blacklist nhiều địa chỉ cùng lúc
    function setBlacklistedBatch(address[] calldata accounts, bool value) external onlyRole(BLACKLISTER_ROLE) {
        uint256 length = accounts.length;
        for (uint256 i = 0; i < length; ) {
            if (accounts[i] != address(0)) {
                _blacklisted[accounts[i]] = value;
                emit Blacklisted(accounts[i], value);
            }
            unchecked { ++i; }
        }
    }

    function isBlacklisted(address account) public view returns (bool) {
        return _blacklisted[account];
    }

    function _isBlacklistedInternal(address account) internal view returns (bool) {
        return _blacklisted[account];
    }
}