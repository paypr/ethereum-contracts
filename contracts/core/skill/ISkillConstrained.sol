// SPDX-License-Identifier: UNLICENSED

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
