/*
 * Copyright (c) 2021 The Paypr Company, LLC
 *
 * This file is part of Paypr Ethereum Contracts.
 *
 * Paypr Ethereum Contracts is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Paypr Ethereum Contracts is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Paypr Ethereum Contracts.  If not, see <https://www.gnu.org/licenses/>.
 */

// SPDX-License-Identifier: GPL-3.0-only

/*
 * Concept and implementation based on OpenZeppelin Contracts AccessControl:
 * https://openzeppelin.com/contracts/
 */

pragma solidity ^0.8.4;

import './RoleSupport.sol';
import './AccessControlSupport.sol';

/**
 * @dev Implementation of Access Roles
 *
 * By default, the admin role for all roles is `SUPER_ADMIN_ROLE`, which means
 * that only accounts with this role will be able to grant or revoke other
 * roles.
 *
 * WARNING: The `SUPER_ADMIN_ROLE` is also its own admin: it has permission to
 * grant and revoke this role. Extra precautions should be taken to secure
 * accounts that have been granted it.
 */
library AccessControlImpl {
  bytes32 private constant ACCESS_CONTROL_STORAGE_POSITION = keccak256('paypr.accessControl.storage');

  struct RoleData {
    mapping(address => bool) members;
    bytes32 adminRole;
  }

  struct AccessControlStorage {
    mapping(bytes32 => RoleData) roles;
  }

  //noinspection NoReturn
  function _accessControlStorage() private pure returns (AccessControlStorage storage ds) {
    bytes32 position = ACCESS_CONTROL_STORAGE_POSITION;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      ds.slot := position
    }
  }

  function hasRole(bytes32 role, address account) internal view returns (bool) {
    return _accessControlStorage().roles[role].members[account];
  }

  /**
   * @dev Revert with a standard message if message sender is missing `role`.
   *
   * See {AccessControlSupport.buildMissingRoleMessage(bytes32, address)} for the revert reason format
   */
  function checkRole(bytes32 role) internal view {
    address account = ContextSupport.msgSender();

    checkRole(role, account);
  }

  /**
   * @dev Revert with a standard message if `account` is missing `role`.
   *
   * See {AccessControlSupport.buildMissingRoleMessage(bytes32, address)} for the revert reason format
   */
  function checkRole(bytes32 role, address account) internal view {
    if (hasRole(role, account)) {
      return;
    }

    revert(AccessControlSupport.buildMissingRoleMessage(role, account));
  }

  /**
   * @dev Returns the admin role that controls `role`. See {grantRole} and {revokeRole}.
   *
   * To change a role's admin, use {_setRoleAdmin}.
   */
  function getRoleAdmin(bytes32 role) internal view returns (bytes32) {
    return _accessControlStorage().roles[role].adminRole;
  }

  /**
   * @dev Sets `adminRole` as ``role``'s admin role.
   *
   * Emits a {RoleAdminChanged} event.
   */
  function setRoleAdmin(bytes32 role, bytes32 adminRole) internal {
    emit RoleAdminChanged(role, getRoleAdmin(role), adminRole, ContextSupport.msgSender());
    _accessControlStorage().roles[role].adminRole = adminRole;
  }

  /**
   * @dev Grants `role` to `account`.
   *
   * If `account` had not been already granted `role`, emits a {RoleGranted} event.
   */
  function grantRole(bytes32 role, address account) internal {
    if (hasRole(role, account)) {
      return;
    }

    _accessControlStorage().roles[role].members[account] = true;
    emit RoleGranted(role, account, ContextSupport.msgSender());
  }

  /**
   * @dev Grants `role` to `account`.
   *
   * If `account` had not been already granted `role`, emits a {RoleGranted} event.
   */
  function revokeRole(bytes32 role, address account) internal {
    if (!hasRole(role, account)) {
      return;
    }

    _accessControlStorage().roles[role].members[account] = false;
    emit RoleRevoked(role, account, ContextSupport.msgSender());
  }

  // have to redeclare here even though they are already declared in IAccessControl
  event RoleAdminChanged(
    bytes32 indexed role,
    bytes32 previousAdminRole,
    bytes32 indexed newAdminRole,
    address indexed sender
  );
  event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
  event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);
}
