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

import '@openzeppelin/contracts-upgradeable/utils/introspection/ERC165StorageUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
import './ConsumableInterfaceSupport.sol';
import './IConsumableProvider.sol';
import './IConsumable.sol';

contract ConsumableProvider is IConsumableProvider {
  using SafeMathUpgradeable for uint256;
  using ConsumableInterfaceSupport for IConsumable;

  mapping(address => uint256) private _amountsToProvide;
  IConsumable[] private _consumablesToProvide;

  function _initializeConsumableProvider(IConsumable.ConsumableAmount[] memory amountsToProvide) internal {
    for (uint256 consumableIndex = 0; consumableIndex < amountsToProvide.length; consumableIndex++) {
      IConsumable.ConsumableAmount memory amountToProvide = amountsToProvide[consumableIndex];
      IConsumable consumable = IConsumable(amountToProvide.consumable);
      require(consumable.supportsConsumableInterface(), 'Provider: Consumable must support interface');

      if (amountToProvide.amount > 0) {
        _amountsToProvide[address(consumable)] = amountToProvide.amount;
        _consumablesToProvide.push(consumable);
      }
    }
  }

  function consumablesProvided() external view override returns (IConsumable[] memory) {
    return _consumablesToProvide;
  }

  function isProvided(IConsumable consumable) external view override returns (bool) {
    return _amountsToProvide[address(consumable)] > 0;
  }

  function amountProvided(IConsumable consumable) external view override returns (uint256) {
    return _amountsToProvide[address(consumable)];
  }

  function _canProvideMultiple(uint256 howMany) internal view returns (bool) {
    if (howMany == 0) {
      return true;
    }

    for (uint256 consumableIndex = 0; consumableIndex < _consumablesToProvide.length; consumableIndex++) {
      IConsumable consumable = _consumablesToProvide[consumableIndex];

      uint256 amountOwned = consumable.balanceOf(address(this));
      uint256 totalAmountToProvide;
      if (howMany > 1) {
        totalAmountToProvide = _amountsToProvide[address(consumable)].mul(howMany);
      } else {
        totalAmountToProvide = _amountsToProvide[address(consumable)];
      }

      if (totalAmountToProvide > amountOwned) {
        return false;
      }
    }

    return true;
  }

  function _provideConsumables(address consumer) internal virtual {
    require(_canProvideMultiple(1), 'Provider: Not enough consumable to provide');

    for (uint256 consumableIndex = 0; consumableIndex < _consumablesToProvide.length; consumableIndex++) {
      IConsumable consumable = _consumablesToProvide[consumableIndex];

      // could fail if not enough resources
      ERC20Upgradeable token = ERC20Upgradeable(address(consumable));
      bool success = token.increaseAllowance(consumer, _amountsToProvide[address(consumable)]);
      require(success, 'Provider: Consumable failed to transfer');

      // enhance: limit the amount transferred for each consumable based on the activity amount
    }
  }

  uint256[50] private ______gap;
}
