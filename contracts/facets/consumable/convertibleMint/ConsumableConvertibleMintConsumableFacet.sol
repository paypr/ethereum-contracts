/*
 * Copyright (c) 2022 The Paypr Company, LLC
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

import '../../disableable/DisableableSupport.sol';
import '../../context/ContextSupport.sol';
import './IConsumableConvertibleMint.sol';
import './ConsumableConvertibleMintImpl.sol';

contract ConsumableConvertibleMintConsumableFacet is IConsumableConvertibleMint {
  function isValidConsumableCombination(IConsumable[] calldata consumables) external view returns (bool) {
    return ConsumableConvertibleMintImpl.isValidConsumableCombination(consumables);
  }

  function validConsumableCombinations() external view returns (ConsumableCombination[] memory) {
    ConsumableCombination[] storage combinations = ConsumableConvertibleMintImpl.validConsumableCombinations();
    uint256 numCombinations = combinations.length;
    ConsumableCombination[] memory newCombinations = new ConsumableCombination[](numCombinations);
    for (uint256 index = 0; index < numCombinations; index++) {
      newCombinations[index] = combinations[index];
    }
    return newCombinations;
  }

  function calcRequiredConsumables(uint256 amount, IConsumable[] calldata consumables)
    external
    view
    returns (IConsumable.ConsumableAmount[] memory)
  {
    return ConsumableConvertibleMintImpl.calcRequiredConsumables(amount, consumables);
  }

  function mint(uint256 amount, IConsumable[] calldata consumables) external {
    DisableableSupport.checkEnabled();

    ConsumableConvertibleMintImpl.mintConsumable(ContextSupport.msgSender(), amount, consumables);
  }
}
