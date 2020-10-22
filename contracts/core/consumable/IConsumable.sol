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

pragma solidity ^0.6.0;

import '@openzeppelin/contracts-ethereum-package/contracts/introspection/IERC165.sol';
import '@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol';

interface IConsumable is IERC165, IERC20 {
  struct ConsumableAmount {
    IConsumable consumable;
    uint256 amount;
  }

  /**
   * @dev Returns the symbol for the ERC20 token, which is usually a shorter
   * version of the name
   */
  //  function symbol() external view returns (string memory);

  /**
   * @dev Returns the number of decimals that this consumable uses.
   *
   * NOTE: The standard number of decimals is 18, to match ETH
   */
  //  function decimals() external pure returns (uint8);

  /**
   * @dev Returns the amount of tokens owned by caller.
   */
  function myBalance() external view returns (uint256);

  /**
   * @dev Returns the remaining number of tokens that caller will be
   * allowed to spend on behalf of `owner` through {transferFrom}. This is
   * zero by default.
   *
   * This value changes when {increaseAllowance}, {decreaseAllowance} or {transferFrom} are called.
   */
  function myAllowance(address owner) external view returns (uint256);

  /**
   * @dev Atomically increases the allowance granted to `spender` by the caller.
   *
   * This is an alternative to {approve} that can be used as a mitigation for
   * problems described in {IERC20-approve}.
   *
   * Emits an {Approval} event indicating the updated allowance.
   */
  //  function increaseAllowance(address spender, uint256 addedValue) public returns (bool);

  /**
   * @dev Atomically decreases the allowance granted to `spender` by the caller.
   *
   * This is an alternative to {approve} that can be used as a mitigation for
   * problems described in {IERC20-approve}.
   *
   * Emits an {Approval} event indicating the updated allowance.
   */
  //  function decreaseAllowance(address spender, uint256 subtractedValue) public returns (bool);
}
