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

import '@openzeppelin/contracts-ethereum-package/contracts/introspection/ERC165.sol';
import './ISkill.sol';
import './ISkillConstrained.sol';
import './SkillConstrainedInterfaceSupport.sol';
import './SkillInterfaceSupport.sol';

contract SkillConstrained is ISkillConstrained, ERC165UpgradeSafe {
  using SkillInterfaceSupport for ISkill;

  struct SkillLevel {
    ISkill skill;
    uint256 level;
  }

  mapping(address => uint256) private _skillLevelsRequired;
  ISkill[] private _skillsRequired;

  function _initializeSkillConstrained() internal initializer {
    __ERC165_init();
    _registerInterface(SkillConstrainedInterfaceSupport.SKILL_CONSTRAINED_INTERFACE_ID);
  }

  function skillsRequired() external override view returns (ISkill[] memory) {
    return _skillsRequired;
  }

  function isSkillRequired(ISkill skill) external override view returns (bool) {
    return _skillLevelsRequired[address(skill)] > 0;
  }

  function skillLevelRequired(ISkill skill) external override view returns (uint256) {
    return _skillLevelsRequired[address(skill)];
  }

  function _requireSkills(SkillLevel[] memory skillLevels) internal {
    for (uint256 skillIndex = 0; skillIndex < skillLevels.length; skillIndex++) {
      _requireSkill(skillLevels[skillIndex].skill, skillLevels[skillIndex].level);
    }
  }

  function _requireSkill(ISkill skill, uint256 level) internal {
    require(level > 0, 'Skill: required skill level is invalid');
    require(skill != ISkill(0), 'Skill: required skill is zero address');
    require(skill.supportsSkillInterface(), 'Skill: required skill does not implement interface');

    _skillLevelsRequired[address(skill)] = level;
    _skillsRequired.push(skill);
  }

  function _checkRequiredSkills(address player) internal view {
    for (uint256 skillIndex = 0; skillIndex < _skillsRequired.length; skillIndex++) {
      ISkill requiredSkill = _skillsRequired[skillIndex];
      uint256 requiredLevel = _skillLevelsRequired[address(requiredSkill)];
      uint256 currentSkillLevel = requiredSkill.currentLevel(player);

      require(currentSkillLevel >= requiredLevel, 'SkillConstrained: missing required skill');
    }
  }

  uint256[50] private ______gap;
}
