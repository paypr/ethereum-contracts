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

import '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';
import '../context/ContextSupport.sol';
import '../erc165/ERC165Support.sol';
import './AccessCheckSupport.sol';
import './RoleSupport.sol';
import './IAccessCheck.sol';

library DelegatingAccessImpl {
  using EnumerableSet for EnumerableSet.AddressSet;

  bytes32 private constant DELEGATING_ACCESS_STORAGE_POSITION = keccak256('paypr.delegatingAccess.storage');

  struct DelegatingAccessStorage {
    EnumerableSet.AddressSet roleDelegates;
  }

  //noinspection NoReturn
  function _delegatingAccessStorage() private pure returns (DelegatingAccessStorage storage ds) {
    bytes32 position = DELEGATING_ACCESS_STORAGE_POSITION;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      ds.slot := position
    }
  }

  function checkDelegateAdmin() internal view {
    AccessCheckSupport.checkRole(RoleSupport.DELEGATE_ADMIN_ROLE);
  }

  function isRoleDelegate(IAccessCheck roleDelegate) internal view returns (bool) {
    return _delegatingAccessStorage().roleDelegates.contains(address(roleDelegate));
  }

  /**
   * @dev Adds the given role delegate
   */
  function addRoleDelegate(IAccessCheck roleDelegate) internal {
    require(address(roleDelegate) != address(0), 'Role delegate cannot be zero address');
    require(
      IERC165(address(roleDelegate)).supportsInterface(type(IAccessCheck).interfaceId),
      'Role delegate must implement interface'
    );

    _delegatingAccessStorage().roleDelegates.add(address(roleDelegate));
    emit RoleDelegateAdded(roleDelegate, ContextSupport.msgSender());
  }

  /**
   * @dev Removes the given role delegate
   */
  function removeRoleDelegate(IAccessCheck roleDelegate) internal {
    require(address(roleDelegate) != address(0), 'Role delegate cannot be zero address');
    _delegatingAccessStorage().roleDelegates.remove(address(roleDelegate));
    emit RoleDelegateRemoved(roleDelegate, ContextSupport.msgSender());
  }

  /**
   * @dev Returns `true` if `account` has been granted `role`.
   */
  function hasRole(bytes32 role, address account) internal view returns (bool) {
    EnumerableSet.AddressSet storage roleDelegates = _delegatingAccessStorage().roleDelegates;
    uint256 roleDelegateLength = roleDelegates.length();
    for (uint256 roleDelegateIndex = 0; roleDelegateIndex < roleDelegateLength; roleDelegateIndex++) {
      IAccessCheck roleDelegate = IAccessCheck(roleDelegates.at(roleDelegateIndex));
      if (roleDelegate.hasRole(role, account)) {
        return true;
      }
    }

    return false;
  }

  // have to redeclare here even though it's already declared in IDelegatingAccess
  event RoleDelegateAdded(IAccessCheck indexed roleDelegate, address indexed sender);
  event RoleDelegateRemoved(IAccessCheck indexed roleDelegate, address indexed sender);
}
