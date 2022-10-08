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

import './OwnableSupport.sol';

library OwnableImpl {
  bytes32 private constant OWNABLE_STORAGE_POSITION = keccak256('paypr.ownable.storage');

  struct OwnableStorage {
    address owner;
  }

  //noinspection NoReturn
  function _ownableStorage() private pure returns (OwnableStorage storage ds) {
    bytes32 position = OWNABLE_STORAGE_POSITION;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      ds.slot := position
    }
  }

  function owner() internal view returns (address) {
    return _ownableStorage().owner;
  }

  function isOwner(address account) internal view returns (bool) {
    return owner() == account;
  }

  function transferOwnership(address newOwner) internal {
    OwnableStorage storage ds = _ownableStorage();
    address previousOwner = ds.owner;
    ds.owner = newOwner;

    emit OwnershipTransferred(previousOwner, newOwner);
  }

  // have to redeclare here even though they are already declared in the interface
  event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
}
