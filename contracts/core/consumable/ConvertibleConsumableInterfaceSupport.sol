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

import '@openzeppelin/contracts-ethereum-package/contracts/introspection/ERC165Checker.sol';
import './IConvertibleConsumable.sol';

library ConvertibleConsumableInterfaceSupport {
  using ERC165Checker for address;

  bytes4 internal constant CONVERTIBLE_CONSUMABLE_INTERFACE_ID = 0x1574139e;

  function supportsConvertibleConsumableInterface(IConvertibleConsumable consumable) internal view returns (bool) {
    return address(consumable).supportsInterface(CONVERTIBLE_CONSUMABLE_INTERFACE_ID);
  }

  function calcConvertibleConsumableInterfaceId(IConvertibleConsumable consumable) internal pure returns (bytes4) {
    return
      consumable.exchangeToken.selector ^
      consumable.asymmetricalExchangeRate.selector ^
      consumable.intrinsicValueExchangeRate.selector ^
      consumable.purchasePriceExchangeRate.selector ^
      consumable.amountExchangeTokenAvailable.selector ^
      consumable.mintByExchange.selector ^
      consumable.amountExchangeTokenNeeded.selector ^
      consumable.burnByExchange.selector ^
      consumable.amountExchangeTokenProvided.selector;
  }
}
