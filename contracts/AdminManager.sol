// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./ITestToken.sol";

/// @title Admin Manager
/// @notice Quản lý admin role với bảo vệ chống renounce last admin
abstract contract AdminManager is AccessControl, ITestToken {
    uint256 private _adminCount;

    function _initializeAdmin(address admin) internal {
        require(admin != address(0), "Admin cannot be zero address");
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _adminCount = 1;
    }

    function grantRole(bytes32 role, address account) public virtual override onlyRole(getRoleAdmin(role)) {
        if (role == DEFAULT_ADMIN_ROLE && !hasRole(DEFAULT_ADMIN_ROLE, account)) {
            _adminCount++;
        }
        super.grantRole(role, account);
    }

    function revokeRole(bytes32 role, address account) public virtual override onlyRole(getRoleAdmin(role)) {
        if (role == DEFAULT_ADMIN_ROLE && hasRole(DEFAULT_ADMIN_ROLE, account)) {
            if (_adminCount <= 1) revert CannotRenounceLastAdmin();
            _adminCount--;
        }
        super.revokeRole(role, account);
    }

    function renounceRole(bytes32 role, address account) public virtual override {
        if (role == DEFAULT_ADMIN_ROLE) {
            if (_adminCount <= 1) revert CannotRenounceLastAdmin();
            _adminCount--;
        }
        super.renounceRole(role, account);
    }

    function getAdminCount() external view returns (uint256) {
        return _adminCount;
    }
}