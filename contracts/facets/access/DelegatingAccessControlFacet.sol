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

import './IAccessDelegate.sol';
import './IDelegatingAccessControl.sol';
import './DelegatingAccessControlImpl.sol';
import '../disableable/DisableableSupport.sol';

contract DelegatingAccessControlFacet is IDelegatingAccessControl {
  function hasRole(bytes32 role, address account) external view override returns (bool) {
    return DelegatingAccessControlImpl.hasRole(role, account);
  }

  function isRoleDelegate(IAccessDelegate roleDelegate) external view override returns (bool) {
    return DelegatingAccessControlImpl.isRoleDelegate(roleDelegate);
  }

  function addRoleDelegate(IAccessDelegate roleDelegate) external override {
    DelegatingAccessControlImpl.checkDelegateAdmin();
    DisableableSupport.checkEnabled();

    DelegatingAccessControlImpl.addRoleDelegate(roleDelegate);
  }

  function removeRoleDelegate(IAccessDelegate roleDelegate) external override {
    DelegatingAccessControlImpl.checkDelegateAdmin();
    DisableableSupport.checkEnabled();

    DelegatingAccessControlImpl.removeRoleDelegate(roleDelegate);
  }
}
