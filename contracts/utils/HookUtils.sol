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
import '@openzeppelin/contracts/utils/Strings.sol';

library HookUtils {
  using EnumerableSet for EnumerableSet.AddressSet;

  function executeHooks(EnumerableSet.AddressSet storage hooks, bytes memory callData) internal {
    uint256 hooksLength = hooks.length();

    for (uint256 hookIndex = 0; hookIndex < hooksLength; hookIndex++) {
      address hook = hooks.at(hookIndex);

      // solhint-disable-next-line avoid-low-level-calls
      (bool success, bytes memory error) = address(hook).delegatecall(callData);
      if (!success) {
        if (error.length > 0) {
          // bubble up the error
          // solhint-disable-next-line no-inline-assembly
          assembly {
            let ptr := mload(0x40)
            let size := returndatasize()
            returndatacopy(ptr, 0, size)
            revert(ptr, size)
          }
        } else {
          revert(string(abi.encodePacked('Hook function failed: ', Strings.toHexString(uint160(hook)))));
        }
      }
    }
  }
}
