// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

import '@openzeppelin/contracts-ethereum-package/contracts/introspection/ERC165Checker.sol';
import './ISkillConstrained.sol';

library SkillConstrainedInterfaceSupport {
  using ERC165Checker for address;

  bytes4 internal constant SKILL_CONSTRAINED_INTERFACE_ID = 0x332b3661;

  function supportsSkillConstrainedInterface(ISkillConstrained skillConstrained) internal view returns (bool) {
    return address(skillConstrained).supportsInterface(SKILL_CONSTRAINED_INTERFACE_ID);
  }
}
