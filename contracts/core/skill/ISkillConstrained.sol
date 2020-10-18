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

import '@openzeppelin/contracts-ethereum-package/contracts/introspection/IERC165.sol';
import './ISkill.sol';

interface ISkillConstrained is IERC165 {
  /**
   * @dev Returns the list of required skills
   */
  function skillsRequired() external view returns (ISkill[] memory);

  /**
   * @dev Returns whether or not the given skill is required
   */
  function isSkillRequired(ISkill skill) external view returns (bool);

  /**
   * @dev Returns the skill level required for the given skill, if any.
   * Returns 0 when skill is not required
   */
  function skillLevelRequired(ISkill skill) external view returns (uint256);
}
