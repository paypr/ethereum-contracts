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

import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import '../../context/ContextSupport.sol';
import '../../access/AccessControlSupport.sol';
import '../../access/RoleSupport.sol';
import '../IConsumable.sol';

library ConsumableLimitImpl {
  using SafeMath for uint256;

  bytes32 private constant CONSUMABLE_LIMIT_STORAGE_POSITION = keccak256('paypr.consumableLimit.storage');

  struct ConsumableLimitStorage {
    mapping(address => uint256) limits;
  }

  //noinspection NoReturn
  function _consumableLimitStorage() private pure returns (ConsumableLimitStorage storage ds) {
    bytes32 position = CONSUMABLE_LIMIT_STORAGE_POSITION;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      ds.slot := position
    }
  }

  function checkLimiter() internal view {
    AccessControlSupport.checkRole(RoleSupport.LIMITER_ROLE);
  }

  function limitOf(address account) internal view returns (uint256) {
    return _consumableLimitStorage().limits[account];
  }

  function myLimit() internal view returns (uint256) {
    return _consumableLimitStorage().limits[ContextSupport.msgSender()];
  }

  /**
   * @dev Increases the limit for `account` by `addedValue`
   *
   * Emits a {Limited} event
   */
  function increaseLimit(address account, uint256 addedValue) internal {
    setLimit(account, limitOf(account).add(addedValue));
  }

  /**
   * @dev Decreases the limit for `account` by `subtractedValue`
   *
   * Emits a {Limited} event
   */
  function decreaseLimit(address account, uint256 subtractedValue) internal {
    setLimit(account, limitOf(account).sub(subtractedValue, 'ConsumableLimit: decreased limit below zero'));
  }

  /**
   * @dev Sets the limit for the `account` to `value`.
   */
  function setLimit(address account, uint256 value) internal {
    require(account != address(0), 'ConsumableLimit: setLimit for the zero address');

    _consumableLimitStorage().limits[account] = value;
    emit LimitChanged(account, value);
  }

  /**
   * @dev check the balance against the limit
   */
  function checkBalanceAgainstLimit(address account) internal view {
    require(
      limitOf(account) >= IConsumable(address(this)).balanceOf(account),
      'ConsumableLimit: account balance over the limit'
    );
  }

  // have to redeclare here even though they are already declared in IConsumableLimit
  event LimitChanged(address indexed account, uint256 value);
}
