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

import '@openzeppelin/contracts/utils/introspection/IERC165.sol';
import '../../access/AccessControlSupport.sol';
import '../../access/RoleSupport.sol';
import '../../consumable/consumer/ConsumableConsumerSupport.sol';
import '../../consumable/provider/ConsumableProviderSupport.sol';
import '../../artifact/IArtifact.sol';
import '../../artifact/ArtifactSupport.sol';
import '../IActivity.sol';

library ActivityExecutorImpl {
  function checkAdmin() internal view {
    AccessControlSupport.checkRole(RoleSupport.ADMIN_ROLE);
  }

  function execute(
    IActivity activity,
    IArtifact.Item[] calldata useItems,
    IConsumable.ConsumableAmount[] calldata amountsToProvide,
    IConsumable.ConsumableAmount[] calldata amountsToConsume
  ) internal {
    require(
      IERC165(address(activity)).supportsInterface(type(IActivity).interfaceId),
      'ActivityExecutor: activity address must support IActivity'
    );

    ArtifactSupport.useItems(address(activity), useItems);

    ConsumableProviderSupport.provideConsumables(address(activity), amountsToProvide);

    address[] memory helpers = ArtifactSupport.asHelpers(useItems);
    activity.execute(helpers);

    ConsumableConsumerSupport.consumeConsumables(address(activity), amountsToConsume);
  }
}
