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

pragma solidity ^0.8.3;
pragma experimental ABIEncoderV2;

import './ExchangingActivity.sol';
import '../skill/SkillConstrained.sol';
import '../access/DelegatingRoles.sol';
import '../Disableable.sol';

contract ConfigurableSkillConstrainedExchangingActivity is
  Initializable,
  ContextUpgradeable,
  ERC165StorageUpgradeable,
  ExchangingActivity,
  SkillConstrained,
  Disableable,
  DelegatingRoles
{
  using TransferLogic for address;

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
    IERC20Upgradeable token,
    uint256 amount,
    address recipient
  ) external override onlyTransferAgent onlyEnabled {
    address(this).transferToken(token, amount, recipient);
  }

  function transferItem(
    IERC721Upgradeable artifact,
    uint256 itemId,
    address recipient
  ) external override onlyTransferAgent onlyEnabled {
    address(this).transferItem(artifact, itemId, recipient);
  }

  function _checkRequirements(address player) internal view override {
    _checkRequiredSkills(player);
  }

  function disable() external override onlyAdmin {
    _disable();
  }

  function enable() external override onlyAdmin {
    _enable();
  }
}
