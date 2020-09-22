// SPDX-License-Identifier: UNLICENSED

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
import '../item/ItemUser.sol';
import '../Disableable.sol';
import '../transfer/BaseTransferring.sol';
import '../transfer/TransferringInterfaceSupport.sol';

abstract contract Activity is
  IActivity,
  ContextUpgradeSafe,
  BaseContract,
  BaseTransferring,
  Disableable,
  ConsumableConsumer,
  ConsumableProvider,
  ItemUser
{
  using Counters for Counters.Counter;

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

  uint256[50] private ______gap;
}