// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import './ExchangingActivity.sol';
import '../skill/SkillConstrained.sol';
import '../access/DelegatingRoles.sol';

contract ConfigurableSkillConstrainedExchangingActivity is SkillConstrained, ExchangingActivity, DelegatingRoles {
  function initializeSkillConstrainedExchangingActivity(
    ContractInfo memory info,
    SkillLevel[] memory requiredSkillLevels,
    IConsumable.ConsumableAmount[] memory amountsToConsume,
    IConsumable.ConsumableAmount[] memory amountsToProvide,
    IConsumableExchange exchange,
    IRoleDelegate roleDelegate
  ) public initializer {
    _initializeExchangingActivity(info, amountsToConsume, amountsToProvide, exchange);
    _initializeSkillConstrained();
    _requireSkills(requiredSkillLevels);

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

  function _checkRequirements(address player) internal override view {
    _checkRequiredSkills(player);
  }

  function disable() external override onlyAdmin {
    _disable();
  }

  function enable() external override onlyAdmin {
    _enable();
  }
}
