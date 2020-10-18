/*
 * Copyright (c) 2020 The Paypr Company
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

import '@openzeppelin/contracts-ethereum-package/contracts/introspection/ERC165Checker.sol';
import './IConsumableConsumer.sol';

library ConsumableConsumerInterfaceSupport {
  using ERC165Checker for address;

  bytes4 internal constant CONSUMABLE_CONSUMER_INTERFACE_ID = 0x9342f6af;

  function supportsConsumableConsumerInterface(IConsumableConsumer consumer) internal view returns (bool) {
    return address(consumer).supportsInterface(CONSUMABLE_CONSUMER_INTERFACE_ID);
  }
}
