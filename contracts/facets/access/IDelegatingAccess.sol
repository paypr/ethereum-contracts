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

import './IAccessCheck.sol';

interface IDelegatingAccess {
  /**
   * @notice Returns `true` if `roleDelegate` is a role delegate.
   */
  function isRoleDelegate(IAccessCheck roleDelegate) external view returns (bool);

  /**
   * @notice Adds the given role delegate
   *
   * Emits a {RoleDelegateAdded} event.
   */
  function addRoleDelegate(IAccessCheck roleDelegate) external;

  /**
   * @notice Removes the given role delegate
   *
   * Emits a {RoleDelegateRemoved} event.
   */
  function removeRoleDelegate(IAccessCheck roleDelegate) external;

  /**
   * @notice Emitted when `roleDelegate` is added.
   *
   * `sender` is the account that originated the contract call
   */
  event RoleDelegateAdded(IAccessCheck indexed roleDelegate, address indexed sender);

  /**
   * @notice Emitted when `roleDelegate` is removed.
   *
   * `sender` is the account that originated the contract call
   */
  event RoleDelegateRemoved(IAccessCheck indexed roleDelegate, address indexed sender);
}
