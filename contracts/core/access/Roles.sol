/*
 * Copyright (c) 2020 The Paypr Company, LLC
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

pragma solidity ^0.8.3;

import '@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol';
import './DelegatingRoles.sol';
import './IRoleDelegate.sol';
import './RoleSupport.sol';

contract Roles is IRoleDelegate, Initializable, ContextUpgradeable, AccessControlUpgradeable, DelegatingRoles {
  function _initializeRoles(IRoleDelegate roleDelegate) public initializer {
    if (address(roleDelegate) != address(0)) {
      _addRoleDelegate(roleDelegate);
    } else {
      _addSuperAdmin(_msgSender());
    }
  }

  function isInRole(bytes32 role, address account) external view override returns (bool) {
    return _hasRole(role, account);
  }

  function _hasRole(bytes32 role, address account) internal view override returns (bool) {
    if (hasRole(role, account)) {
      return true;
    }

    return super._hasRole(role, account);
  }

  // SuperAdmin
  modifier onlySuperAdmin() {
    require(isSuperAdmin(_msgSender()), 'Caller does not have the SuperAdmin role');
    _;
  }

  function isSuperAdmin(address account) public view returns (bool) {
    return _hasRole(RoleSupport.SUPER_ADMIN_ROLE, account);
  }

  function addSuperAdmin(address account) public virtual onlySuperAdmin {
    _addSuperAdmin(account);
  }

  function _addSuperAdmin(address account) internal {
    _setupRole(RoleSupport.SUPER_ADMIN_ROLE, account);
  }

  function renounceSuperAdmin() public virtual {
    renounceRole(RoleSupport.SUPER_ADMIN_ROLE, _msgSender());
  }

  function revokeSuperAdmin(address account) public virtual {
    revokeRole(RoleSupport.SUPER_ADMIN_ROLE, account);
  }

  // Admin
  function addAdmin(address account) public virtual onlySuperAdmin {
    _addAdmin(account);
  }

  function _addAdmin(address account) internal {
    _setupRole(RoleSupport.ADMIN_ROLE, account);
  }

  function renounceAdmin() public virtual {
    renounceRole(RoleSupport.ADMIN_ROLE, _msgSender());
  }

  function revokeAdmin(address account) public virtual {
    revokeRole(RoleSupport.ADMIN_ROLE, account);
  }

  // Minter
  function addMinter(address account) public virtual onlySuperAdmin {
    _addMinter(account);
  }

  function _addMinter(address account) internal {
    _setupRole(RoleSupport.MINTER_ROLE, account);
  }

  function renounceMinter() public virtual {
    renounceRole(RoleSupport.MINTER_ROLE, _msgSender());
  }

  function revokeMinter(address account) public virtual {
    revokeRole(RoleSupport.MINTER_ROLE, account);
  }

  // Transfer Agent
  function addTransferAgent(address account) public virtual onlySuperAdmin {
    _addTransferAgent(account);
  }

  function _addTransferAgent(address account) internal {
    _setupRole(RoleSupport.TRANSFER_AGENT_ROLE, account);
  }

  function renounceTransferAgent() public virtual {
    renounceRole(RoleSupport.TRANSFER_AGENT_ROLE, _msgSender());
  }

  function revokeTransferAgent(address account) public virtual {
    revokeRole(RoleSupport.TRANSFER_AGENT_ROLE, account);
  }

  uint256[50] private ______gap;
}
