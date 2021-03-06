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

pragma solidity ^0.8.3;

import '@openzeppelin/contracts-upgradeable/utils/introspection/ERC165CheckerUpgradeable.sol';
import './IConsumableExchange.sol';

library ConsumableExchangeInterfaceSupport {
  using ERC165CheckerUpgradeable for address;

  bytes4 internal constant CONSUMABLE_EXCHANGE_INTERFACE_ID = 0x1e34ecc8;

  function supportsConsumableExchangeInterface(IConsumableExchange exchange) internal view returns (bool) {
    return address(exchange).supportsInterface(CONSUMABLE_EXCHANGE_INTERFACE_ID);
  }

  function calcConsumableExchangeInterfaceId(IConsumableExchange exchange) internal pure returns (bytes4) {
    return
      exchange.totalConvertibles.selector ^
      exchange.convertibleAt.selector ^
      exchange.isConvertible.selector ^
      exchange.exchangeRateOf.selector ^
      exchange.exchangeTo.selector ^
      exchange.exchangeFrom.selector ^
      exchange.registerToken.selector;
  }
}
