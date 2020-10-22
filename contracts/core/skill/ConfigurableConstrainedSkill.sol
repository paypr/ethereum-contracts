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
pragma experimental ABIEncoderV2;

import './ConstrainedSkill.sol';
import '../access/DelegatingRoles.sol';
import '../Disableable.sol';

contract ConfigurableConstrainedSkill is
  Initializable,
  ContextUpgradeSafe,
  ConstrainedSkill,
  Disableable,
  DelegatingRoles
{
  using TransferLogic for address;

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
    address(this).transferToken(token, amount, recipient);
  }

  function transferItem(
    IERC721 artifact,
    uint256 itemId,
    address recipient
  ) external override onlyTransferAgent onlyEnabled {
    address(this).transferItem(artifact, itemId, recipient);
  }

  function disable() external override onlyAdmin {
    _disable();
  }

  function enable() external override onlyAdmin {
    _enable();
  }
}
