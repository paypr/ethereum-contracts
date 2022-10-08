/*
 * Copyright (c) 2022 The Paypr Company, LLC
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

import '../../context/ContextSupport.sol';
import '../../erc165/ERC165Support.sol';
import './IOwnable.sol';
import './OwnableImpl.sol';
import '../RoleSupport.sol';
import '../IAccessCheck.sol';

/*
 * Concept and implementation based on OpenZeppelin Contracts Ownable:
 * https://openzeppelin.com/contracts/
 */

contract OwnableFacet is IOwnable {
  function owner() external view returns (address) {
    return OwnableImpl.owner();
  }

  function isOwner(address account) external view returns (bool) {
    return OwnableImpl.isOwner(account);
  }

  function renounceOwnership() external {
    require(this.owner() == ContextSupport.msgSender(), 'Ownable: caller is not the owner');
    OwnableImpl.transferOwnership(address(0));
  }

  function transferOwnership(address newOwner) external {
    address sender = ContextSupport.msgSender();
    bool supportsAccessControl = ERC165Support.isInterfaceSupported(type(IAccessCheck).interfaceId);
    bool isOwnableManager = supportsAccessControl &&
      IAccessCheck(address(this)).hasRole(RoleSupport.OWNER_MANAGER_ROLE, sender);

    require(this.isOwner(sender) || isOwnableManager, 'Ownable: caller is not the owner or owner manager');

    OwnableImpl.transferOwnership(newOwner);
  }
}
