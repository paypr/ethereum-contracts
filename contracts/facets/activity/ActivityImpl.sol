/*
 * Copyright (c) 2021 The Paypr Company, LLC
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

pragma solidity ^0.8.4;

import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';
import '../../utils/HookUtils.sol';
import '../consumable/consumer/ConsumableConsumerSupport.sol';
import '../context/ContextSupport.sol';
import './IActivityHooks.sol';

library ActivityImpl {
  using Counters for Counters.Counter;
  using EnumerableSet for EnumerableSet.AddressSet;

  bytes32 private constant ACTIVITY_STORAGE_POSITION = keccak256('paypr.activity.storage');

  struct ActivityStorage {
    mapping(address => Counters.Counter) executed;
    Counters.Counter totalExecuted;
    EnumerableSet.AddressSet hooks;
  }

  //noinspection NoReturn
  function _activityStorage() private pure returns (ActivityStorage storage ds) {
    bytes32 position = ACTIVITY_STORAGE_POSITION;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      ds.slot := position
    }
  }

  function executed(address player) internal view returns (uint256) {
    return _activityStorage().executed[player].current();
  }

  function totalExecuted() internal view returns (uint256) {
    return _activityStorage().totalExecuted.current();
  }

  function execute(address[] calldata helpers) internal {
    address player = ContextSupport.msgSender();

    address[] memory providers = ConsumableConsumerSupport.buildProviders(player, helpers);

    _beforeActivityExecution(player, providers);

    ActivityStorage storage ds = _activityStorage();

    ds.executed[player].increment();
    ds.totalExecuted.increment();

    _afterActivityExecution(player, providers);

    emit Executed(player);
  }

  function addHooks(IActivityHooks activityHooks) internal {
    require(address(activityHooks) != address(0), 'Activity: adding hook of the zero address');

    _activityStorage().hooks.add(address(activityHooks));
  }

  function removeHooks(IActivityHooks activityHooks) internal {
    require(address(activityHooks) != address(0), 'Activity: removing hook of the zero address');

    _activityStorage().hooks.remove(address(activityHooks));
  }

  function _beforeActivityExecution(address player, address[] memory providers) private {
    bytes memory callData = abi.encodeWithSelector(IActivityHooks.beforeActivityExecution.selector, player, providers);
    _executeHooks(callData);
  }

  function _afterActivityExecution(address player, address[] memory providers) private {
    bytes memory callData = abi.encodeWithSelector(IActivityHooks.afterActivityExecution.selector, player, providers);
    _executeHooks(callData);
  }

  function _executeHooks(bytes memory callData) private {
    EnumerableSet.AddressSet storage hooks = _activityStorage().hooks;
    HookUtils.executeHooks(hooks, callData);
  }

  // have to redeclare here even though they are already declared in IActivity
  event Executed(address indexed player);
}
