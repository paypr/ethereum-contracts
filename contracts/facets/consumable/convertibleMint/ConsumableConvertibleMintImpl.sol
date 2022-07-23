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

import '../IConsumable.sol';
import '../ERC20Impl.sol';
import '../TransferFailed.sol';
import './IConsumableConvertibleMint.sol';

library ConsumableConvertibleMintImpl {
  bytes32 private constant CONVERTIBLE_MINT_STORAGE_POSITION = keccak256('paypr.consumableConvertibleMint.storage');

  struct ConsumableConvertibleMintStorage {
    /**
     * The combinations of consumables that can be used. It is expected that this is a small number of combinations
     * so looping over the combinations is cheaper than both hashing the consumables and
     * keeping track of the additional data.
     */
    IConsumableConvertibleMint.ConsumableCombination[] combinations;
  }

  //noinspection NoReturn
  function _consumableConvertibleMintStorage() private pure returns (ConsumableConvertibleMintStorage storage ds) {
    bytes32 position = CONVERTIBLE_MINT_STORAGE_POSITION;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      ds.slot := position
    }
  }

  function isValidConsumableCombination(IConsumable[] calldata consumables) internal view returns (bool) {
    return _findConsumableCombinationIndex(consumables) >= 0;
  }

  function validConsumableCombinations()
    internal
    view
    returns (IConsumableConvertibleMint.ConsumableCombination[] storage)
  {
    return _consumableConvertibleMintStorage().combinations;
  }

  function setValidConsumableCombinations(IConsumableConvertibleMint.ConsumableCombination[] calldata combinations)
    internal
  {
    IConsumableConvertibleMint.ConsumableCombination[] storage newCombinations = _consumableConvertibleMintStorage()
      .combinations;
    uint256 numOldCombinations = newCombinations.length;

    uint256 numNewCombinations = combinations.length;
    for (uint256 index = 0; index < numNewCombinations; index++) {
      if (index < numOldCombinations) {
        newCombinations[index] = combinations[index];
      } else {
        newCombinations.push(combinations[index]);
      }
    }

    for (uint256 index = numNewCombinations; index < numOldCombinations; index++) {
      newCombinations.pop();
    }
  }

  function addValidConsumableCombination(IConsumableConvertibleMint.ConsumableCombination calldata combination)
    internal
  {
    _consumableConvertibleMintStorage().combinations.push(combination);
  }

  function removeValidConsumableCombination(IConsumable[] calldata consumables) internal {
    int256 index = _findConsumableCombinationIndex(consumables);
    if (index < 0) {
      revert IConsumableConvertibleMint.ConsumableCombinationNotFound(consumables);
    }

    IConsumableConvertibleMint.ConsumableCombination[] storage combinations = validConsumableCombinations();
    uint256 uindex = uint256(index);
    if (uindex != combinations.length - 1) {
      combinations[uindex] = combinations[combinations.length - 1];
    }

    combinations.pop();
  }

  function calcRequiredConsumables(uint256 amount, IConsumable[] calldata consumables)
    internal
    view
    returns (IConsumable.ConsumableAmount[] memory)
  {
    int256 index = _findConsumableCombinationIndex(consumables);
    if (index < 0) {
      revert IConsumableConvertibleMint.ConsumableCombinationNotFound(consumables);
    }

    IConsumableConvertibleMint.ConsumableCombination storage combination = _consumableConvertibleMintStorage()
      .combinations[uint256(index)];
    IConsumable.ConsumableAmount[] storage requiredConsumables = combination.requiredConsumables;
    uint256 numAmounts = requiredConsumables.length;
    uint256 amountProvided = combination.amountProvided;

    IConsumable.ConsumableAmount[] memory result = new IConsumable.ConsumableAmount[](numAmounts);
    for (uint256 amountIndex = 0; amountIndex < numAmounts; amountIndex++) {
      IConsumable.ConsumableAmount storage requiredConsumable = requiredConsumables[amountIndex];
      uint256 newAmount = calcRequiredAmount(requiredConsumable.amount, amountProvided, amount);
      result[amountIndex] = IConsumable.ConsumableAmount({
        consumable: requiredConsumable.consumable,
        amount: newAmount
      });
    }

    return result;
  }

  function _findConsumableCombinationIndex(IConsumable[] calldata consumables) private view returns (int256) {
    IConsumableConvertibleMint.ConsumableCombination[] storage combinations = validConsumableCombinations();
    uint256 numCombinations = combinations.length;
    for (uint256 combinationIndex = 0; combinationIndex < numCombinations; combinationIndex++) {
      IConsumable.ConsumableAmount[] storage amounts = combinations[combinationIndex].requiredConsumables;
      uint256 numAmounts = amounts.length;
      if (numAmounts != consumables.length) {
        continue;
      }

      uint8 numCorrect = 0;

      // forces the same order, could be improved to support any order but at a higher cost
      for (uint8 consumableIndex = 0; consumableIndex < numAmounts; consumableIndex++) {
        IConsumable consumable = amounts[consumableIndex].consumable;
        if (amounts[consumableIndex].consumable == consumables[consumableIndex]) {
          numCorrect++;
        }
      }

      if (numCorrect == numAmounts) {
        return int256(combinationIndex);
      }
    }

    return -1;
  }

  function mintConsumable(
    address to,
    uint256 amount,
    IConsumable[] calldata consumables
  ) internal {
    int256 index = _findConsumableCombinationIndex(consumables);
    if (index < 0) {
      revert IConsumableConvertibleMint.ConsumableCombinationNotFound(consumables);
    }

    IConsumableConvertibleMint.ConsumableCombination storage combination = _consumableConvertibleMintStorage()
      .combinations[uint256(index)];
    IConsumable.ConsumableAmount[] storage requiredConsumables = combination.requiredConsumables;
    uint256 amountProvided = combination.amountProvided;
    uint256 numRequired = requiredConsumables.length;
    for (uint8 amountIndex = 0; amountIndex < numRequired; amountIndex++) {
      IConsumable.ConsumableAmount storage requiredConsumableAmount = requiredConsumables[amountIndex];
      uint256 requiredAmount = calcRequiredAmount(requiredConsumableAmount.amount, amountProvided, amount);
      if (!requiredConsumableAmount.consumable.transferFrom(to, address(this), requiredAmount)) {
        revert TransferFailed();
      }
    }

    ERC20Impl.mint(to, amount);
  }

  function calcRequiredAmount(
    uint256 requiredAmount,
    uint256 providedPerRequired,
    uint256 desiredAmount
  ) internal pure returns (uint256) {
    uint256 totalAmount = requiredAmount * desiredAmount;
    uint256 amount = totalAmount / providedPerRequired;
    if (totalAmount % providedPerRequired != 0) {
      amount += 1;
    }
    return amount;
  }
}
