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

import '../access/AccessControlSupport.sol';
import '../access/RoleSupport.sol';
import '../context/ContextSupport.sol';

library DisableableImpl {
  bytes32 private constant DISABLEABLE_STORAGE_POSITION = keccak256('paypr.disableable.storage');

  struct DisableableStorage {
    bool disabled;
  }

  //noinspection NoReturn
  function _disableableStorage() private pure returns (DisableableStorage storage ds) {
    bytes32 position = DISABLEABLE_STORAGE_POSITION;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      ds.slot := position
    }
  }

  function checkDisabler() internal view {
    AccessControlSupport.checkRole(RoleSupport.DISABLER_ROLE);
  }

  function disabled() internal view returns (bool) {
    return _disableableStorage().disabled;
  }

  function enabled() internal view returns (bool) {
    return !_disableableStorage().disabled;
  }

  function disable() internal {
    DisableableStorage storage ds = _disableableStorage();

    if (ds.disabled) {
      return;
    }

    ds.disabled = true;
    emit Disabled(ContextSupport.msgSender());
  }

  function enable() internal {
    DisableableStorage storage ds = _disableableStorage();

    if (!ds.disabled) {
      return;
    }

    ds.disabled = false;
    emit Enabled(ContextSupport.msgSender());
  }

  // have to redeclare here even though they are already declared in IDisableable
  event Disabled(address indexed sender);
  event Enabled(address indexed sender);
}
