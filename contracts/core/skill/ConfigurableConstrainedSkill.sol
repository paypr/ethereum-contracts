// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import './ConstrainedSkill.sol';
import '../access/DelegatingRoles.sol';

contract ConfigurableConstrainedSkill is ConstrainedSkill, DelegatingRoles {
  function initializeConstrainedSkill(
    ContractInfo memory info,
    IConsumable.ConsumableAmount[] memory amountsToConsume,
    SkillLevel[] memory skillLevels,
    IRoleDelegate roleDelegate
  ) public initializer {
    _initializeConstrainedSkill(info, amountsToConsume);
    _requireSkills(skillLevels);

    _addRoleDelegate(roleDelegate);
  }

  function transferToken(
    IERC20 token,
    uint256 amount,
    address recipient
  ) external override onlyTransferAgent onlyEnabled {
    _transferToken(token, amount, recipient);
  }

  function transferItem(
    IERC721 artifact,
    uint256 itemId,
    address recipient
  ) external override onlyTransferAgent onlyEnabled {
    _transferItem(artifact, itemId, recipient);
  }

  function disable() external override onlyAdmin {
    _disable();
  }

  function enable() external override onlyAdmin {
    _enable();
  }
}
