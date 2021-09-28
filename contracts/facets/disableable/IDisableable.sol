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

interface IDisableable {
  /**
   * @notice Returns whether or not the contract is disabled
   */
  function disabled() external view returns (bool);

  /**
   * @notice Returns whether or not the contract is enabled
   */
  function enabled() external view returns (bool);

  /**
   * @notice Disables the contract
   *
   * Emits a {Disabled} event if not already disabled.
   */
  function disable() external;

  /**
   * @notice Enables the contract
   *
   * Emits an {Ensabled} event if not already enabled.
   */
  function enable() external;

  /**
   * @notice Emitted when the contract is disabled
   *
   * `sender` is the account that originated the contract call
   */
  event Disabled(address indexed sender);

  /**
   * @notice Emitted when the contract is enabled
   *
   * `sender` is the account that originated the contract call
   */
  event Enabled(address indexed sender);
}
