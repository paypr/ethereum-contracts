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

import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import '../../erc165/ERC165Support.sol';
import '../conversion/ConsumableConversionMath.sol';
import '../exchange/IConsumableExchange.sol';
import './IConsumableProvider.sol';

library ConsumableProviderSupport {
  using ConsumableConversionMath for uint256;
  using SafeMath for uint256;

  function isConsumableProvider() internal view returns (bool) {
    return ERC165Support.isInterfaceSupported(type(IConsumableProvider).interfaceId);
  }

  function providedConsumables() internal view returns (IConsumable.ConsumableAmount[] memory) {
    if (!isConsumableProvider()) {
      IConsumable.ConsumableAmount[] memory consumables;
      return consumables;
    }

    return IConsumableProvider(address(this)).providedConsumables();
  }

  function canProvideMultiple(uint256 howMany) internal view returns (bool) {
    if (howMany == 0) {
      return true;
    }

    if (!isConsumableProvider()) {
      return true;
    }

    IConsumable.ConsumableAmount[] memory consumablesToProvide = IConsumableProvider(address(this))
      .providedConsumables();

    return canProvideMultiple(howMany, consumablesToProvide);
  }

  function canProvideMultiple(uint256 howMany, IConsumable.ConsumableAmount[] memory consumablesToProvide)
    internal
    view
    returns (bool)
  {
    for (uint256 consumableIndex = 0; consumableIndex < consumablesToProvide.length; consumableIndex++) {
      IConsumable.ConsumableAmount memory consumableAmount = consumablesToProvide[consumableIndex];
      IConsumable consumable = consumableAmount.consumable;

      uint256 amountOwned = consumable.balanceOf(address(this));
      uint256 totalAmountToProvide;
      if (howMany > 1) {
        totalAmountToProvide = consumableAmount.amount.mul(howMany);
      } else {
        totalAmountToProvide = consumableAmount.amount;
      }

      if (totalAmountToProvide > amountOwned) {
        return false;
      }
    }

    return true;
  }

  function provideConsumables(address consumer) internal {
    if (!isConsumableProvider()) {
      return;
    }

    IConsumable.ConsumableAmount[] memory consumablesToProvide = providedConsumables();

    provideConsumables(consumer, consumablesToProvide);
  }

  function provideConsumables(address consumer, IConsumable.ConsumableAmount[] memory consumablesToProvide) internal {
    require(canProvideMultiple(1, consumablesToProvide), 'ConsumableProvider: Not enough consumable to provide');

    for (uint256 consumableIndex = 0; consumableIndex < consumablesToProvide.length; consumableIndex++) {
      IConsumable.ConsumableAmount memory consumableAmount = consumablesToProvide[consumableIndex];

      // could fail if not enough resources
      bool success = consumableAmount.consumable.increaseAllowance(consumer, consumableAmount.amount);
      require(success, 'Provider: Consumable failed to transfer');

      // enhance: limit the amount transferred for each consumable based on the activity amount
    }
  }

  function convertConsumablesFromExchange(IConsumableExchange exchange) internal {
    IConsumable.ConsumableAmount[] memory consumablesToProvide = providedConsumables();
    for (uint256 consumableIndex = 0; consumableIndex < consumablesToProvide.length; consumableIndex++) {
      IConsumable.ConsumableAmount memory consumableAmount = consumablesToProvide[consumableIndex];
      IConsumable consumable = consumableAmount.consumable;

      require(
        IERC165(address(consumable)).supportsInterface(type(IConsumableConversion).interfaceId),
        'Provider: Consumable is not convertible'
      );

      IConsumableConversion convertibleConsumable = IConsumableConversion(address(consumable));

      uint256 amountToProvide = consumableAmount.amount;

      IConsumableExchange.ExchangeRate memory exchangeRate = exchange.exchangeRateOf(convertibleConsumable);

      uint256 exchangeAmount = amountToProvide.exchangeTokenNeeded(exchangeRate.purchasePrice);

      if (exchangeAmount > 0) {
        exchange.exchangeTo(convertibleConsumable, exchangeAmount);

        bool success = consumable.transferFrom(
          address(exchange),
          address(this),
          exchangeAmount.convertibleTokenProvided(exchangeRate.purchasePrice)
        );
        require(success, 'Provider: Consumable failed to transfer');
      }
    }
  }
}
