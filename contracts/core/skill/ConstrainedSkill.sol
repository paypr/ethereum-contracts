// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import './SkillConstrained.sol';
import './Skill.sol';
import '../consumable/ConsumableConsumer.sol';
import '../consumable/ConsumableConsumerInterfaceSupport.sol';

abstract contract ConstrainedSkill is Skill, SkillConstrained, ConsumableConsumer {
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
