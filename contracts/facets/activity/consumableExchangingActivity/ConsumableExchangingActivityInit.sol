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

import '../../consumable/consumer/ConsumableConsumerImpl.sol';
import '../../consumable/provider/ConsumableProviderImpl.sol';
import '../../consumable/IConsumable.sol';
import '../../consumable/exchange/IConsumableExchange.sol';
import '../../consumable/exchanging/ConsumableExchangingImpl.sol';
import '../IActivityHooks.sol';
import '../ActivityImpl.sol';

contract ConsumableExchangingActivityInit {
  struct ConsumableExchangingActivityData {
    IConsumableExchange exchange;
    IConsumable.ConsumableAmount[] requiredConsumables;
    IConsumable.ConsumableAmount[] providedConsumables;
    IActivityHooks consumableExchangingActivityHooks;
  }

  function initialize(ConsumableExchangingActivityData calldata data) external {
    ConsumableExchangingImpl.setExchange(data.exchange);
    ConsumableConsumerImpl.setRequiredConsumables(data.requiredConsumables);
    ConsumableProviderImpl.setProvidedConsumables(data.providedConsumables);
    ConsumableExchangingImpl.updateExchangeProfit(data.requiredConsumables, data.providedConsumables);
    ActivityImpl.addHooks(data.consumableExchangingActivityHooks);
  }
}
