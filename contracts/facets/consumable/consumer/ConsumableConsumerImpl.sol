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
import './IConsumableConsumer.sol';

library ConsumableConsumerImpl {
  bytes32 private constant CONSUMABLE_CONSUMER_STORAGE_POSITION = keccak256('paypr.consumableConsumer.storage');

  struct ConsumableConsumerStorage {
    IConsumable.ConsumableAmount[] requiredConsumables;
  }

  //noinspection NoReturn
  function _consumableConsumerStorage() private pure returns (ConsumableConsumerStorage storage ds) {
    bytes32 position = CONSUMABLE_CONSUMER_STORAGE_POSITION;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      ds.slot := position
    }
  }

  function requiredConsumables() internal view returns (IConsumable.ConsumableAmount[] storage) {
    return _consumableConsumerStorage().requiredConsumables;
  }

  function setRequiredConsumables(IConsumable.ConsumableAmount[] memory consumablesToConsume) internal {
    ConsumableConsumerStorage storage ccs = _consumableConsumerStorage();
    delete ccs.requiredConsumables;
    for (uint256 consumableIndex = 0; consumableIndex < consumablesToConsume.length; consumableIndex++) {
      IConsumable.ConsumableAmount memory consumableAmount = consumablesToConsume[consumableIndex];
      require(consumableAmount.amount > 0, 'ConsumableConsumer: required consumable amount is invalid');
      require(
        consumableAmount.consumable != IConsumable(address(0)),
        'ConsumableConsumer: required consumable is zero address'
      );
      require(
        IERC165(address(consumableAmount.consumable)).supportsInterface(type(IConsumable).interfaceId),
        'ConsumableConsumer: Consumable must support interface'
      );
      ccs.requiredConsumables.push(consumableAmount);
    }
  }
}
