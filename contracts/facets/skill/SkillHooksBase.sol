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

import './ISkillHooks.sol';

abstract contract SkillHooksBase is ISkillHooks {
  // solhint-disable no-empty-blocks
  function beforeSkillAcquisition(
    address player,
    uint256 previousLevel,
    uint256 newLevel,
    address[] calldata providers
  ) external payable virtual override {}

  function afterSkillAcquisition(
    address player,
    uint256 previousLevel,
    uint256 newLevel,
    address[] calldata providers
  ) external payable virtual override {}
  // solhint-enable no-empty-blocks
}
