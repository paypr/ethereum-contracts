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

import '@openzeppelin/contracts-upgradeable/utils/introspection/IERC165Upgradeable.sol';
import './IConsumable.sol';

interface IConsumableConsumer {
  /**
   * @dev Returns the list of required consumables
   */
  function consumablesRequired() external view returns (IConsumable[] memory);

  /**
   * @dev Returns whether or not the given consumable is required.
   */
  function isRequired(IConsumable consumable) external view returns (bool);

  /**
   * @dev Returns the amount of the given consumable that is required.
   */
  function amountRequired(IConsumable consumable) external view returns (uint256);
}
