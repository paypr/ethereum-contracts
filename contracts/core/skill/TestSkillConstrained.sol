// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import './SkillConstrained.sol';

contract TestSkillConstrained is SkillConstrained {
  function initializeSkillConstrained(SkillLevel[] memory skillLevels) public initializer {
    _requireSkills(skillLevels);
  }

  function checkRequiredSkills(address player) external view {
    _checkRequiredSkills(player);
  }
}
