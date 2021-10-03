import './IAccessControl.sol';
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

pragma solidity ^0.8.4;

import '../disableable/DisableableSupport.sol';
import './IAccessControl.sol';
import './AccessControlImpl.sol';
import './AccessControlSupport.sol';

contract AccessControlFacet is IAccessControl {
  function hasRole(bytes32 role, address account) external view override returns (bool) {
    return AccessControlImpl.hasRole(role, account);
  }

  function getRoleAdmin(bytes32 role) external view override returns (bytes32) {
    return AccessControlImpl.getRoleAdmin(role);
  }

  function grantRole(bytes32 role, address account) external virtual override {
    AccessControlSupport.checkAdminRole(role);
    DisableableSupport.checkEnabled();

    AccessControlImpl.grantRole(role, account);
  }

  function revokeRole(bytes32 role, address account) external virtual override {
    AccessControlSupport.checkAdminRole(role);
    DisableableSupport.checkEnabled();

    AccessControlImpl.revokeRole(role, account);
  }

  function renounceRole(bytes32 role) public virtual override {
    address account = ContextSupport.msgSender();
    DisableableSupport.checkEnabled();

    AccessControlImpl.revokeRole(role, account);
  }

  function setRoleAdmin(bytes32 role, bytes32 adminRole) external virtual override {
    AccessControlSupport.checkAdminRole(role);
    DisableableSupport.checkEnabled();

    AccessControlImpl.setRoleAdmin(role, adminRole);
  }
}
