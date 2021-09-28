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

import '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';
import '../consumable/consumer/ConsumableConsumerSupport.sol';
import '../../utils/HookUtils.sol';
import '../context/ContextSupport.sol';
import './ISkillHooks.sol';

library SkillImpl {
  using EnumerableSet for EnumerableSet.AddressSet;

  bytes32 private constant SKILL_STORAGE_POSITION = keccak256('paypr.skill.storage');

  struct SkillStorage {
    mapping(address => uint256) levels;
    EnumerableSet.AddressSet hooks;
  }

  //noinspection NoReturn
  function _skillStorage() private pure returns (SkillStorage storage ds) {
    bytes32 position = SKILL_STORAGE_POSITION;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      ds.slot := position
    }
  }

  function currentLevel(address player) internal view returns (uint256) {
    return _skillStorage().levels[player];
  }

  function myCurrentLevel() internal view returns (uint256) {
    return currentLevel(ContextSupport.msgSender());
  }

  function acquireNext(address[] memory helpers) internal {
    address player = ContextSupport.msgSender();

    uint256 newLevel = currentLevel(player) + 1;

    checkPreviousLevel(player, newLevel);

    acquire(player, newLevel, helpers);
  }

  function acquire(
    address player,
    uint256 newLevel,
    address[] memory helpers
  ) internal {
    address[] memory providers = ConsumableConsumerSupport.buildProviders(player, helpers);

    uint256 previousLevel = currentLevel(player);

    _beforeSkillAcquisition(player, previousLevel, newLevel, providers);

    _skillStorage().levels[player] = newLevel;

    _afterSkillAcquisition(player, previousLevel, newLevel, providers);

    emit Acquired(player, newLevel);
  }

  function checkPreviousLevel(address player, uint256 level) internal view {
    require(level == currentLevel(player) + 1, 'Skill: acquire invalid level');
  }

  function addHooks(ISkillHooks skillHooks) internal {
    require(address(skillHooks) != address(0), 'Skill: adding hook of the zero address');

    _skillStorage().hooks.add(address(skillHooks));
  }

  function removeHooks(ISkillHooks skillHooks) internal {
    require(address(skillHooks) != address(0), 'Skill: removing hook of the zero address');

    _skillStorage().hooks.remove(address(skillHooks));
  }

  function _beforeSkillAcquisition(
    address player,
    uint256 previousLevel,
    uint256 newLevel,
    address[] memory providers
  ) private {
    bytes memory callData = abi.encodeWithSelector(
      ISkillHooks.beforeSkillAcquisition.selector,
      player,
      previousLevel,
      newLevel,
      providers
    );
    _executeHooks(callData);
  }

  function _afterSkillAcquisition(
    address player,
    uint256 previousLevel,
    uint256 newLevel,
    address[] memory providers
  ) private {
    bytes memory callData = abi.encodeWithSelector(
      ISkillHooks.afterSkillAcquisition.selector,
      player,
      previousLevel,
      newLevel,
      providers
    );
    _executeHooks(callData);
  }

  function _executeHooks(bytes memory callData) private {
    EnumerableSet.AddressSet storage hooks = _skillStorage().hooks;
    HookUtils.executeHooks(hooks, callData);
  }

  // have to redeclare here even though they are already declared in ISkill
  event Acquired(address indexed player, uint256 level);
}
