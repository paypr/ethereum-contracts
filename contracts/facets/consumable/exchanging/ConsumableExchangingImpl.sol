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

import '@openzeppelin/contracts/utils/introspection/IERC165.sol';
import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import '../consumer/ConsumableConsumerSupport.sol';
import '../conversion/ConsumableConversionMath.sol';
import '../provider/ConsumableProviderSupport.sol';
import '../exchange/IConsumableExchange.sol';

library ConsumableExchangingImpl {
  using SafeMath for uint256;
  using ConsumableConversionMath for IConsumableExchange;

  bytes32 private constant CONSUMABLE_EXCHANGING_STORAGE_POSITION = keccak256('paypr.consumableExchanging.storage');

  struct ConsumableExchangingStorage {
    IConsumableExchange exchange;
    uint256 exchangeProfit;
  }

  //noinspection NoReturn
  function _consumableExchangingStorage() private pure returns (ConsumableExchangingStorage storage ds) {
    bytes32 position = CONSUMABLE_EXCHANGING_STORAGE_POSITION;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      ds.slot := position
    }
  }

  function exchange() internal view returns (IConsumableExchange) {
    return _consumableExchangingStorage().exchange;
  }

  function setExchange(IConsumableExchange _exchange) internal {
    require(
      IERC165(address(_exchange)).supportsInterface(type(IConsumableExchange).interfaceId),
      'ConsumableExchanging: exchange must be a consumable exchange'
    );

    _consumableExchangingStorage().exchange = _exchange;
  }

  function exchangeProfit() internal view returns (uint256) {
    return _consumableExchangingStorage().exchangeProfit;
  }

  function updateExchangeProfit(
    IConsumable.ConsumableAmount[] memory requiredConsumables,
    IConsumable.ConsumableAmount[] memory providedConsumables
  ) internal {
    IConsumableExchange _exchange = exchange();

    uint256 consumedAmount = _exchange.exchangeTokenProvided(requiredConsumables);
    uint256 providedAmount = _exchange.exchangeTokenNeeded(providedConsumables);

    uint256 _exchangeProfit = consumedAmount.sub(
      providedAmount,
      'ConsumableExchanging: Not enough exchange token consumed to be sustainable'
    );

    _consumableExchangingStorage().exchangeProfit = _exchangeProfit;
  }
}
