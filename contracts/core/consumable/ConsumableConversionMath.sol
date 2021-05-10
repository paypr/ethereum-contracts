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

import '@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol';
import './IConvertibleConsumable.sol';
import './ConvertibleConsumableInterfaceSupport.sol';
import './IConsumableExchange.sol';

library ConsumableConversionMath {
  using SafeMathUpgradeable for uint256;
  using ConvertibleConsumableInterfaceSupport for IConvertibleConsumable;

  function exchangeTokenNeeded(IConsumable.ConsumableAmount memory consumableAmount) internal view returns (uint256) {
    IConvertibleConsumable consumable = IConvertibleConsumable(address(consumableAmount.consumable));
    require(
      consumable.supportsConvertibleConsumableInterface(),
      'ConsumableConversionMath: consumable not convertible'
    );

    uint256 purchasePriceExchangeRate = consumable.purchasePriceExchangeRate();
    return exchangeTokenNeeded(consumableAmount.amount, purchasePriceExchangeRate);
  }

  function exchangeTokenProvided(IConsumable.ConsumableAmount memory consumableAmount) internal view returns (uint256) {
    IConvertibleConsumable consumable = IConvertibleConsumable(address(consumableAmount.consumable));
    require(
      consumable.supportsConvertibleConsumableInterface(),
      'ConsumableConversionMath: consumable not convertible'
    );

    uint256 intrinsicValueExchangeRate = consumable.intrinsicValueExchangeRate();
    return exchangeTokenProvided(consumableAmount.amount, intrinsicValueExchangeRate);
  }

  function exchangeTokenNeeded(uint256 consumableAmount, uint256 purchasePriceExchangeRate)
    internal
    pure
    returns (uint256)
  {
    return _toExchangeToken(consumableAmount, purchasePriceExchangeRate, true);
  }

  function exchangeTokenProvided(uint256 consumableAmount, uint256 intrinsicValueExchangeRate)
    internal
    pure
    returns (uint256)
  {
    return _toExchangeToken(consumableAmount, intrinsicValueExchangeRate, false);
  }

  function _toExchangeToken(
    uint256 consumableAmount,
    uint256 exchangeRate,
    bool purchasing
  ) private pure returns (uint256) {
    uint256 amountExchangeToken = consumableAmount.div(exchangeRate);
    if (purchasing && consumableAmount.mod(exchangeRate) != 0) {
      amountExchangeToken += 1;
    }
    return amountExchangeToken;
  }

  function convertibleTokenNeeded(uint256 exchangeTokenAmount, uint256 intrinsicValueExchangeRate)
    internal
    pure
    returns (uint256)
  {
    return _fromExchangeToken(exchangeTokenAmount, intrinsicValueExchangeRate);
  }

  function convertibleTokenProvided(uint256 exchangeTokenAmount, uint256 purchasePriceExchangeRate)
    internal
    pure
    returns (uint256)
  {
    return _fromExchangeToken(exchangeTokenAmount, purchasePriceExchangeRate);
  }

  function _fromExchangeToken(uint256 exchangeTokenAmount, uint256 exchangeRate) private pure returns (uint256) {
    return exchangeTokenAmount.mul(exchangeRate);
  }

  function exchangeTokenNeeded(IConsumableExchange exchange, IConsumable.ConsumableAmount[] memory consumableAmounts)
    internal
    view
    returns (uint256)
  {
    return _toExchangeToken(exchange, consumableAmounts, true);
  }

  function exchangeTokenProvided(IConsumableExchange exchange, IConsumable.ConsumableAmount[] memory consumableAmounts)
    internal
    view
    returns (uint256)
  {
    return _toExchangeToken(exchange, consumableAmounts, false);
  }

  function _toExchangeToken(
    IConsumableExchange exchange,
    IConsumable.ConsumableAmount[] memory consumableAmounts,
    bool purchasing
  ) private view returns (uint256) {
    uint256 totalAmount = 0;

    for (uint256 consumableIndex = 0; consumableIndex < consumableAmounts.length; consumableIndex++) {
      IConsumable.ConsumableAmount memory consumableAmount = consumableAmounts[consumableIndex];
      IConsumable consumable = consumableAmount.consumable;
      IConvertibleConsumable convertibleConsumable = IConvertibleConsumable(address(consumable));
      uint256 amount = consumableAmount.amount;

      require(
        exchange.isConvertible(convertibleConsumable),
        'ConsumableConversionMath: Consumable must be convertible by exchange'
      );

      IConsumableExchange.ExchangeRate memory exchangeRate = exchange.exchangeRateOf(convertibleConsumable);
      uint256 exchangeAmount;
      if (purchasing) {
        exchangeAmount = _toExchangeToken(amount, exchangeRate.purchasePrice, true);
      } else {
        exchangeAmount = _toExchangeToken(amount, exchangeRate.intrinsicValue, false);
      }

      totalAmount = totalAmount.add(exchangeAmount);
    }

    return totalAmount;
  }
}
