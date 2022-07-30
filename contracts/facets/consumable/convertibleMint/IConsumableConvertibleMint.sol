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

interface IConsumableConvertibleMint {
  struct ConsumableCombination {
    IConsumable.ConsumableAmount[] requiredConsumables;
    uint256 amountProvided;
  }

  /**
   * @notice Thrown when the given consumable combination isn't found
   */
  error ConsumableCombinationNotFound(IConsumable[] consumables);

  /**
   * @notice Returns whether or not the provided consumables comprise a valid consumable combination
   */
  function isValidConsumableCombination(IConsumable[] calldata consumables) external view returns (bool);

  /**
   * @notice Returns all of the valid combinations of consumables that can be provided for the mint call
   */
  function validConsumableCombinations() external view returns (ConsumableCombination[] calldata);

  /**
   * @notice Returns the required amount for each consumable to mint the given amount of this token.
   */
  function calcRequiredConsumables(uint256 amount, IConsumable[] calldata consumables)
    external
    view
    returns (IConsumable.ConsumableAmount[] calldata);

  /**
   * @notice Consumes a certain amount of other resources and creates `amount` tokens and assigns them to the caller,
   * increasing the total supply.
   *
   * Requirements:
   * - caller must approve the proper amount of valid consumables
   */
  function mint(uint256 amount, IConsumable[] calldata consumables) external;
}
