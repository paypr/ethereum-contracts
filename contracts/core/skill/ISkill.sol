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
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts-ethereum-package/contracts/introspection/IERC165.sol';

interface ISkill is IERC165 {
  /**
   * Emitted when a skill level is acquired
   *
   * @param player Address of the player
   * @param level The skill level acquired
   */
  event Acquired(address indexed player, uint256 level);

  /**
   * @dev Returns the current level for the sender
   */
  function myCurrentLevel() external view returns (uint256);

  /**
   * @dev Returns the current level for the given player
   */
  function currentLevel(address player) external view returns (uint256);

  /**
   * @dev Acquire the next skill level for the sender.
   * Reverts if the sender does not have the skill requirements.
   */
  function acquireNext(address[] calldata helpers) external returns (bool);
}
