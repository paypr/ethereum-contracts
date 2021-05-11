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

interface IConsumableLimit {
  /**
   * @notice Returns the amount of tokens `account` is limited to.
   */
  function limitOf(address account) external view returns (uint256);

  /**
   * @notice Returns the amount of tokens the caller is limited to.
   */
  function myLimit() external view returns (uint256);

  /**
   * @notice Emitted when the limit of an `account` is updated. `value` is the new limit.
   */
  event LimitChanged(address indexed account, uint256 value);
}
