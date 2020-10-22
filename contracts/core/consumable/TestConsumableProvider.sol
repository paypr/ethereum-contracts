/*
 * Copyright (c) 2020 The Paypr Company, LLC
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

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import './ConsumableProvider.sol';

contract TestConsumableProvider is ConsumableProvider {
  function initializeConsumableProvider(IConsumable.ConsumableAmount[] memory amountsToProvide) public {
    _initializeConsumableProvider(amountsToProvide);
  }

  function canProvideMultiple(uint256 howMany) public view returns (bool) {
    return _canProvideMultiple(howMany);
  }

  function provideConsumables(address consumer) public {
    _provideConsumables(consumer);
  }
}
