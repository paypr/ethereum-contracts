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
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts-ethereum-package/contracts/GSN/Context.sol';
import '@openzeppelin/contracts-ethereum-package/contracts/utils/Counters.sol';
import './ActivityInterfaceSupport.sol';
import './IActivity.sol';
import '../consumable/ConsumableConsumer.sol';
import '../consumable/ConsumableConsumerInterfaceSupport.sol';
import '../consumable/ConsumableProvider.sol';
import '../consumable/ConsumableProviderInterfaceSupport.sol';
import '../BaseContract.sol';
import '../IDisableable.sol';
import '../transfer/TransferringInterfaceSupport.sol';
import '../transfer/ITransferring.sol';
import '../transfer/TransferLogic.sol';

abstract contract Activity is
  IDisableable,
  Initializable,
  ITransferring,
  IActivity,
  ContextUpgradeSafe,
  ERC165UpgradeSafe,
  BaseContract,
  ConsumableConsumer,
  ConsumableProvider
{
  using Counters for Counters.Counter;
  using TransferLogic for address;

  mapping(address => Counters.Counter) private _executed;
  Counters.Counter private _totalExecuted;

  function _initializeActivity(
    ContractInfo memory info,
    IConsumable.ConsumableAmount[] memory amountsToConsume,
    IConsumable.ConsumableAmount[] memory amountsToProvide
  ) internal initializer {
    _initializeBaseContract(info);
    _registerInterface(ActivityInterfaceSupport.ACTIVITY_INTERFACE_ID);

    _initializeConsumableConsumer(amountsToConsume);
    _registerInterface(ConsumableConsumerInterfaceSupport.CONSUMABLE_CONSUMER_INTERFACE_ID);

    _initializeConsumableProvider(amountsToProvide);
    _registerInterface(ConsumableProviderInterfaceSupport.CONSUMABLE_PROVIDER_INTERFACE_ID);

    _registerInterface(TransferringInterfaceSupport.TRANSFERRING_INTERFACE_ID);
  }

  function executed(address player) external override view returns (uint256) {
    return _executed[player].current();
  }

  function totalExecuted() external override view returns (uint256) {
    return _totalExecuted.current();
  }

  function execute(address[] calldata helpers) external override onlyEnabled {
    address player = _msgSender();

    _checkRequirements(player);

    _executed[player].increment();
    _totalExecuted.increment();

    address[] memory providers = new address[](helpers.length + 1);
    for (uint256 helperIndex = 0; helperIndex < helpers.length; helperIndex++) {
      providers[helperIndex] = helpers[helperIndex];
    }

    providers[helpers.length] = player;

    _consumeConsumables(providers);
    _provideConsumables(player);

    emit Executed(player);
  }

  function _checkRequirements(address player) internal virtual view {
    // does nothing by default
  }

  function onERC721Received(
    address operator,
    address from,
    uint256 tokenId,
    bytes calldata data
  ) external virtual override returns (bytes4) {
    return TransferLogic.onERC721Received(operator, from, tokenId, data);
  }

  uint256[50] private ______gap;
}
