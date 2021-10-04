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

import '@openzeppelin/contracts/utils/Strings.sol';
import './IAccessControl.sol';
import './IAccessCheck.sol';
import '../context/ContextSupport.sol';

library AccessCheckSupport {
  /**
   * @dev Revert with a standard message if message sender is missing the admin role for `role`.
   *
   * See {buildMissingRoleMessage(bytes32, address)} for the revert reason format
   */
  function checkAdminRole(bytes32 role) internal view {
    address account = ContextSupport.msgSender();

    bytes32 adminRole = (IAccessControl(address(this)).getRoleAdmin(role));

    checkRole(adminRole);
  }

  /**
   * @dev Revert with a standard message if message sender is missing `role`.
   *
   * See {buildMissingRoleMessage(bytes32, address)} for the revert reason format
   */
  function checkRole(bytes32 role) internal view {
    address account = ContextSupport.msgSender();

    if (IAccessCheck(address(this)).hasRole(role, account)) {
      return;
    }

    revert(buildMissingRoleMessage(role, account));
  }

  /**
   * Builds a revert reason in the following format:
   *   AccessControl: account {account} is missing role {role}
   */
  function buildMissingRoleMessage(bytes32 role, address account) internal pure returns (string memory) {
    return
      string(
        abi.encodePacked(
          'AccessCheck: account ',
          Strings.toHexString(uint160(account), 20),
          ' is missing role ',
          Strings.toHexString(uint256(role), 32)
        )
      );
  }
}
