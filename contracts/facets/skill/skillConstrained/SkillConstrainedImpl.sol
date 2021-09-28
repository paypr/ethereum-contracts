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

import '@openzeppelin/contracts/utils/introspection/IERC165.sol';
import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import './ISkillConstrained.sol';

library SkillConstrainedImpl {
  using SafeMath for uint256;

  bytes32 private constant SKILL_CONSTRAINED_STORAGE_POSITION = keccak256('paypr.skillConstrained.storage');

  struct SkillConstrainedStorage {
    ISkill.SkillLevel[] requiredSkills;
  }

  //noinspection NoReturn
  function _skillConstrainedStorage() private pure returns (SkillConstrainedStorage storage ds) {
    bytes32 position = SKILL_CONSTRAINED_STORAGE_POSITION;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      ds.slot := position
    }
  }

  function requiredSkills() internal view returns (ISkill.SkillLevel[] storage) {
    return _skillConstrainedStorage().requiredSkills;
  }

  function setRequiredSkills(ISkill.SkillLevel[] memory skills) internal {
    SkillConstrainedStorage storage ccs = _skillConstrainedStorage();
    delete ccs.requiredSkills;
    for (uint256 skillIndex = 0; skillIndex < skills.length; skillIndex++) {
      ISkill.SkillLevel memory skillLevel = skills[skillIndex];
      require(skillLevel.level > 0, 'SkillConstrained: required skill level is invalid');
      require(skillLevel.skill != ISkill(address(0)), 'SkillConstrained: required skill is zero address');
      require(
        IERC165(address(skillLevel.skill)).supportsInterface(type(ISkill).interfaceId),
        'SkillConstrained: Skill must support interface'
      );
      ccs.requiredSkills.push(skillLevel);
    }
  }

  function checkRequiredSkills(address player) internal view {
    ISkill.SkillLevel[] storage skillLevels = requiredSkills();
    for (uint256 skillIndex = 0; skillIndex < skillLevels.length; skillIndex++) {
      ISkill.SkillLevel storage skillLevel = skillLevels[skillIndex];
      uint256 currentSkillLevel = skillLevel.skill.currentLevel(player);

      require(currentSkillLevel >= skillLevel.level, 'SkillConstrained: missing required skill');
    }
  }
}
