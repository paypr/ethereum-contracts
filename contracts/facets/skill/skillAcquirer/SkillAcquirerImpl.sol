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
import '../../access/AccessCheckSupport.sol';
import '../../access/RoleSupport.sol';
import '../../artifact/IArtifact.sol';
import '../../consumable/IConsumable.sol';
import '../../consumable/provider/ConsumableProviderSupport.sol';
import '../ISkillSelfAcquisition.sol';
import '../../artifact/ArtifactSupport.sol';

library SkillAcquirerImpl {
  function checkAdmin() internal view {
    AccessCheckSupport.checkRole(RoleSupport.ADMIN_ROLE);
  }

  function acquireNext(
    ISkillSelfAcquisition skill,
    IArtifact.Item[] calldata useItems,
    IConsumable.ConsumableAmount[] calldata amountsToProvide
  ) internal {
    require(
      IERC165(address(skill)).supportsInterface(type(ISkillSelfAcquisition).interfaceId),
      'SkillAcquirer: skill address must support ISkillSelfAcquisition'
    );

    ArtifactSupport.useItems(address(skill), useItems);

    ConsumableProviderSupport.provideConsumables(address(skill), amountsToProvide);

    address[] memory helpers = ArtifactSupport.asHelpers(useItems);

    skill.acquireNext(helpers);
  }
}
