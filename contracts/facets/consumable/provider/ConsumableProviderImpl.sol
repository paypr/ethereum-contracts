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
import './IConsumableProvider.sol';

library ConsumableProviderImpl {
  bytes32 private constant CONSUMABLE_PROVIDER_STORAGE_POSITION = keccak256('paypr.consumableProvider.storage');

  struct ConsumableProviderStorage {
    IConsumable.ConsumableAmount[] providedConsumables;
  }

  //noinspection NoReturn
  function _consumableProviderStorage() private pure returns (ConsumableProviderStorage storage ds) {
    bytes32 position = CONSUMABLE_PROVIDER_STORAGE_POSITION;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      ds.slot := position
    }
  }

  function providedConsumables() internal view returns (IConsumable.ConsumableAmount[] storage) {
    return _consumableProviderStorage().providedConsumables;
  }

  function setProvidedConsumables(IConsumable.ConsumableAmount[] memory consumablesToProvide) internal {
    ConsumableProviderStorage storage ccs = _consumableProviderStorage();
    delete ccs.providedConsumables;
    for (uint256 consumableIndex = 0; consumableIndex < consumablesToProvide.length; consumableIndex++) {
      IConsumable.ConsumableAmount memory consumableAmount = consumablesToProvide[consumableIndex];
      require(consumableAmount.amount > 0, 'ConsumableProvider: provided consumable amount is invalid');
      require(
        consumableAmount.consumable != IConsumable(address(0)),
        'ConsumableProvider: provided consumable is zero address'
      );
      require(
        IERC165(address(consumableAmount.consumable)).supportsInterface(type(IConsumable).interfaceId),
        'ConsumableProvider: Consumable must support interface'
      );
      ccs.providedConsumables.push(consumableAmount);
    }
  }
}
