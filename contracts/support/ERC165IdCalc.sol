/*
 * Copyright (c) 2020 The Paypr Company, LLC
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

import '@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol';
import '../core/activity/IActivity.sol';
import '../core/item/IArtifact.sol';
import '../core/consumable/IConsumable.sol';
import '../core/consumable/IConsumableConsumer.sol';
import '../core/consumable/IConsumableProvider.sol';
import '../core/consumable/ILimitedConsumable.sol';
import '../core/consumable/ConsumableExchangeInterfaceSupport.sol';
import '../core/consumable/ConvertibleConsumableInterfaceSupport.sol';
import '../core/IBaseContract.sol';
import '../core/player/IPlayer.sol';
import '../core/skill/ISkill.sol';
import '../core/skill/ISkillConstrained.sol';
import '../core/consumable/IConsumableExchange.sol';
import '../core/consumable/IConvertibleConsumable.sol';
import '../core/transfer/ITransferring.sol';
import '../core/access/IRoleDelegate.sol';

/**
 * Idea comes from https://medium.com/coinmonks/ethereum-standard-erc165-explained-63b54ca0d273
 */
contract ERC165IdCalc {
  using ConvertibleConsumableInterfaceSupport for IConvertibleConsumable;
  using ConsumableExchangeInterfaceSupport for IConsumableExchange;

  function calcActivityInterfaceId() external pure returns (bytes4) {
    IActivity activity;
    return activity.executed.selector ^ activity.totalExecuted.selector;
  }

  function calcArtifactInterfaceId() external pure returns (bytes4) {
    IArtifact artifact;
    return
      artifact.initialUses.selector ^
      artifact.usesLeft.selector ^
      artifact.totalUsesLeft.selector ^
      artifact.useItem.selector;
  }

  function calcBaseContractInterfaceId() external pure returns (bytes4) {
    IBaseContract baseContract;
    return
      baseContract.contractName.selector ^
      baseContract.contractDescription.selector ^
      baseContract.contractUri.selector;
  }

  function calcConsumableInterfaceId() external pure returns (bytes4) {
    ERC20UpgradeSafe token;
    IConsumable consumable;
    return
      token.symbol.selector ^
      token.decimals.selector ^
      consumable.totalSupply.selector ^
      consumable.myBalance.selector ^
      consumable.balanceOf.selector ^
      consumable.myAllowance.selector ^
      consumable.allowance.selector ^
      consumable.transfer.selector ^
      token.increaseAllowance.selector ^
      token.decreaseAllowance.selector ^
      consumable.transferFrom.selector;
  }

  function calcConsumableConsumerInterfaceId() external pure returns (bytes4) {
    IConsumableConsumer consumer;
    return consumer.consumablesRequired.selector ^ consumer.isRequired.selector ^ consumer.amountRequired.selector;
  }

  function calcConsumableExchangeInterfaceId() external pure returns (bytes4) {
    IConsumableExchange exchange;
    return exchange.calcConsumableExchangeInterfaceId();
  }

  function calcConsumableProviderInterfaceId() external pure returns (bytes4) {
    IConsumableProvider provider;
    return provider.consumablesProvided.selector ^ provider.isProvided.selector ^ provider.amountProvided.selector;
  }

  function calcConvertibleConsumableInterfaceId() external pure returns (bytes4) {
    IConvertibleConsumable consumable;
    return consumable.calcConvertibleConsumableInterfaceId();
  }

  function calcLimitedConsumableInterfaceId() external pure returns (bytes4) {
    ILimitedConsumable limitedConsumable;
    return limitedConsumable.limitOf.selector ^ limitedConsumable.myLimit.selector;
  }

  function calcPlayerInterfaceId() external pure returns (bytes4) {
    IPlayer player;
    return player.execute.selector ^ player.acquireNext.selector;
  }

  function calcRoleDelegateInterfaceId() external pure returns (bytes4) {
    IRoleDelegate roleDelegate;
    return roleDelegate.isInRole.selector;
  }

  function calcSkillInterfaceId() external pure returns (bytes4) {
    ISkill skill;
    return skill.myCurrentLevel.selector ^ skill.currentLevel.selector ^ skill.acquireNext.selector;
  }

  function calcSkillConstrainedInterfaceId() external pure returns (bytes4) {
    ISkillConstrained skillConstrained;
    return
      skillConstrained.skillsRequired.selector ^
      skillConstrained.isSkillRequired.selector ^
      skillConstrained.skillLevelRequired.selector;
  }

  function calcTransferInterfaceId() external pure returns (bytes4) {
    ITransferring transfer;
    return transfer.transferToken.selector ^ transfer.transferItem.selector;
  }
}
