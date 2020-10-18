/*
 * Copyright (c) 2020 The Paypr Company
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

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts-ethereum-package/contracts/introspection/IERC165.sol';
import '../consumable/IConsumableConsumer.sol';
import '../consumable/IConsumableProvider.sol';

interface IActivity is IERC165, IConsumableConsumer, IConsumableProvider {
  /**
   * Emitted when an item is used
   *
   * @param player Address of the player who executed the activity
   */
  event Executed(address indexed player);

  /**
   * @dev Returns the number of times this activity has been executed by the given `player`
   */
  function executed(address player) external view returns (uint256);

  /**
   * @dev Returns the total number of times this activity has been executed
   */
  function totalExecuted() external view returns (uint256);

  /**
   * @dev Execute the activity with the given `helpers`.
   *
   * Note: be sure to add allowances for any consumables required before executing.
   *
   * Emits an {Executed} event indicating the activity was executed.
   */
  function execute(address[] calldata helpers) external;
}
