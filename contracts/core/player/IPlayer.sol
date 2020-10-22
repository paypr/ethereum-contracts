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
import '../item/IArtifact.sol';
import '../consumable/IConsumable.sol';
import '../activity/IActivity.sol';
import '../skill/ISkill.sol';

interface IPlayer is IERC165 {
  /**
   * @dev Executes the given activity (see {IActivity}), using the given
   * items (see {IArtifact})
   */
  function execute(
    IActivity activity,
    IArtifact.Item[] calldata useItems,
    IConsumable.ConsumableAmount[] calldata amountsToProvide,
    IConsumable.ConsumableAmount[] calldata amountsToConsume
  ) external;

  /**
   * @dev Acquires the given skill (see {ISkill}), using the given
   * items (see {IArtifact})
   */
  function acquireNext(
    ISkill skill,
    IArtifact.Item[] calldata useItems,
    IConsumable.ConsumableAmount[] calldata amountsToProvide
  ) external;
}
