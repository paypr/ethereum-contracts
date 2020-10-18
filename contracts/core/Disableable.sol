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

abstract contract Disableable {
  bool private _disabled;

  /**
   * @dev Returns whether or not the contract is disabled
   */
  function disabled() external view returns (bool) {
    return _disabled;
  }

  /**
   * @dev Returns whether or not the contract is enabled
   */
  function enabled() external view returns (bool) {
    return !_disabled;
  }

  modifier onlyEnabled() {
    require(!_disabled, 'Contract is disabled');
    _;
  }

  /**
   * @dev Disables the contract
   */
  function disable() external virtual;

  /**
   * @dev Disables the contract
   */
  function _disable() internal {
    if (_disabled) {
      return;
    }

    _disabled = true;
    emit Disabled();
  }

  /**
   * @dev Enables the contract
   */
  function enable() external virtual;

  /**
   * @dev Enables the contract
   */
  function _enable() internal {
    if (!_disabled) {
      return;
    }

    _disabled = false;
    emit Enabled();
  }

  /**
   * Emitted when the contract is disabled
   */
  event Disabled();

  /**
   * Emitted when the contract is enabled
   */
  event Enabled();

  uint256[50] private ______gap;
}
