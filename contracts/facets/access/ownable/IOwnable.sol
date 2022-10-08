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

/*
 * Concept and implementation based on OpenZeppelin Contracts Ownable:
 * https://openzeppelin.com/contracts/
 */

interface IOwnable {
  /**
   * @notice Returns the address of the current owner.
   */
  function owner() external view returns (address);

  /**
   * @notice Returns whether or not the given account is the owner.
   *
   * NOTE: It is possible this returns true for advanced access control cases
   * even when the account does not match the result of owner().
   */
  function isOwner(address account) external view returns (bool);

  /**
   * @notice Leaves the contract without an owner. Can only be called by the current owner.
   *
   * NOTE: Renouncing ownership will leave the contract without an owner,
   * thereby removing any functionality that is only available to the owner.
   */
  function renounceOwnership() external;

  /**
   * @notice Transfers ownership of the contract to a new account (`newOwner`).
   * Can only be called by the current owner or by someone with the Ownable Manager role.
   */
  function transferOwnership(address newOwner) external;

  /**
   * @notice Emitted when ownership is transferred from one address to another
   */
  event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
}
