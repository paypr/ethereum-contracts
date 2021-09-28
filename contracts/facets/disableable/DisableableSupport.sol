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

import './IDisableable.sol';
import '../erc165/ERC165Support.sol';

library DisableableSupport {
  /**
   * @dev Revert if contract is disabled.
   *
   * Only checks if the contract supports the IDisableable interface
   */
  function checkEnabled() internal view {
    if (!ERC165Support.isInterfaceSupported(type(IDisableable).interfaceId)) {
      return;
    }

    checkEnabledUnsafe();
  }

  /**
   * @dev Revert if contract is disabled.
   *
   * Assumes this contract is IDisableable.
   *
   * It's recommended to use {checkEnabled} except in performance-critical code.
   */
  function checkEnabledUnsafe() internal view {
    require(IDisableable(address(this)).enabled(), 'Contract is disabled');
  }
}
