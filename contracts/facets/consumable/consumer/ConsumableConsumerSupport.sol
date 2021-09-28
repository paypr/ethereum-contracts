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
import '../IConsumable.sol';
import './IConsumableConsumer.sol';
import '../exchange/IConsumableExchange.sol';
import '../conversion/ConsumableConversionMath.sol';

library ConsumableConsumerSupport {
  using ConsumableConversionMath for uint256;
  using SafeMath for uint256;

  function isConsumableConsumer() internal view returns (bool) {
    return ERC165Support.isInterfaceSupported(type(IConsumableConsumer).interfaceId);
  }

  function requiredConsumables() internal view returns (IConsumable.ConsumableAmount[] memory) {
    if (!isConsumableConsumer()) {
      IConsumable.ConsumableAmount[] memory consumables;
      return consumables;
    }

    return IConsumableConsumer(address(this)).requiredConsumables();
  }

  function consumeConsumables(address[] memory providers) internal {
    if (!isConsumableConsumer()) {
      return;
    }

    IConsumable.ConsumableAmount[] memory consumablesToConsume = requiredConsumables();

    consumeConsumables(providers, consumablesToConsume);
  }

  function consumeConsumables(address provider, IConsumable.ConsumableAmount[] memory consumablesToConsume) internal {
    address[] memory providers = new address[](1);
    providers[0] = provider;
    consumeConsumables(providers, consumablesToConsume);
  }

  function consumeConsumables(address[] memory providers, IConsumable.ConsumableAmount[] memory consumablesToConsume)
    internal
  {
    for (uint256 consumableIndex = 0; consumableIndex < consumablesToConsume.length; consumableIndex++) {
      IConsumable.ConsumableAmount memory consumableAmount = consumablesToConsume[consumableIndex];

      IConsumable consumable = consumableAmount.consumable;
      uint256 amount = consumableAmount.amount;

      for (uint256 providerIndex; providerIndex < providers.length; providerIndex++) {
        address provider = providers[providerIndex];

        uint256 amountToConsume = consumable.allowance(provider, address(this));

        bool success = consumable.transferFrom(provider, address(this), amountToConsume);
        require(success, 'ConsumableConsumer: Consumable failed to transfer');

        if (amount > amountToConsume) {
          amount = amount.sub(amountToConsume);
        } else {
          amount = 0;
        }
      }

      require(amount == 0, 'ConsumableConsumer: Not enough consumable to transfer');
    }
  }

  function convertConsumablesToExchange(IConsumableExchange exchange) internal {
    IConsumable.ConsumableAmount[] memory consumables = requiredConsumables();

    for (uint256 consumableIndex = 0; consumableIndex < consumables.length; consumableIndex++) {
      IConsumable consumable = consumables[consumableIndex].consumable;

      require(
        IERC165(address(consumable)).supportsInterface(type(IConsumableConversion).interfaceId),
        'Consumer: Consumable is not convertible'
      );

      IConsumableConversion convertibleConsumable = IConsumableConversion(address(consumable));

      IConsumableExchange.ExchangeRate memory exchangeRate = exchange.exchangeRateOf(convertibleConsumable);

      uint256 consumableBalance = consumable.myBalance();

      uint256 amount = consumableBalance.exchangeTokenProvided(exchangeRate.intrinsicValue).convertibleTokenNeeded(
        exchangeRate.intrinsicValue
      );

      if (amount > 0) {
        consumable.increaseAllowance(address(exchange), amount);
        exchange.exchangeFrom(convertibleConsumable, amount);
      }
    }
  }

  function buildProviders(address player, address[] memory helpers) internal pure returns (address[] memory) {
    address[] memory providers = new address[](helpers.length + 1);

    for (uint256 helperIndex = 0; helperIndex < helpers.length; helperIndex++) {
      providers[helperIndex] = helpers[helperIndex];
    }

    providers[helpers.length] = player;

    return providers;
  }
}
