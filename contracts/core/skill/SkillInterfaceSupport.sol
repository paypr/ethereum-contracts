// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

import '@openzeppelin/contracts-ethereum-package/contracts/introspection/ERC165Checker.sol';
import './ISkill.sol';

library SkillInterfaceSupport {
  using ERC165Checker for address;

  bytes4 internal constant SKILL_INTERFACE_ID = 0xa87617d1;

  function supportsSkillInterface(ISkill skill) internal view returns (bool) {
    return address(skill).supportsInterface(SKILL_INTERFACE_ID);
  }
}
