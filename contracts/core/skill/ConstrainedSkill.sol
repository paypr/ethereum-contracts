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

pragma solidity ^0.8.3;
pragma experimental ABIEncoderV2;

import './SkillConstrained.sol';
import './Skill.sol';
import '../consumable/ConsumableConsumer.sol';
import '../consumable/ConsumableConsumerInterfaceSupport.sol';

abstract contract ConstrainedSkill is
  Initializable,
  ContextUpgradeable,
  ERC165StorageUpgradeable,
  Skill,
  SkillConstrained,
  ConsumableConsumer
{
  using ConsumableInterfaceSupport for IConsumable;

  function _initializeConstrainedSkill(ContractInfo memory info, IConsumable.ConsumableAmount[] memory amountsToConsume)
    internal
    initializer
  {
    _initializeSkill(info);
    _initializeSkillConstrained();

    _initializeConsumableConsumer(amountsToConsume);
    _registerInterface(ConsumableConsumerInterfaceSupport.CONSUMABLE_CONSUMER_INTERFACE_ID);
  }

  function _gatherRequirements(
    address player,
    uint256 level,
    address[] memory providers
  ) internal override onlyEnabled {
    super._gatherRequirements(player, level, providers);

    super._checkRequiredSkills(player);

    _consumeConsumables(providers);
  }

  function _transfer(
    IConsumable consumable,
    uint256 amount,
    address recipient
  ) internal onlyEnabled {
    require(consumable.supportsConsumableInterface(), 'Skill: consumable is not IConsumable');
    consumable.transfer(address(recipient), amount);
  }

  uint256[50] private ______gap;
}
