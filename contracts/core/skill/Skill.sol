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

import '@openzeppelin/contracts-ethereum-package/contracts/GSN/Context.sol';
import '../BaseContract.sol';
import './ISkill.sol';
import './SkillInterfaceSupport.sol';
import '../IDisableable.sol';
import '../transfer/TransferringInterfaceSupport.sol';
import '../transfer/ITransferring.sol';
import '../transfer/TransferLogic.sol';

abstract contract Skill is
  IDisableable,
  Initializable,
  ITransferring,
  ISkill,
  ContextUpgradeSafe,
  ERC165UpgradeSafe,
  BaseContract
{
  using TransferLogic for address;

  mapping(address => uint256) private _levels;

  function _initializeSkill(ContractInfo memory info) internal initializer {
    _initializeBaseContract(info);
    _registerInterface(SkillInterfaceSupport.SKILL_INTERFACE_ID);
    _registerInterface(TransferringInterfaceSupport.TRANSFERRING_INTERFACE_ID);
  }

  function myCurrentLevel() external override view returns (uint256) {
    return currentLevel(_msgSender());
  }

  function currentLevel(address player) public override view returns (uint256) {
    return _levels[player];
  }

  function acquireNext(address[] calldata helpers) external override returns (bool) {
    address player = _msgSender();

    _acquire(player, _levels[player] + 1, helpers);

    return true;
  }

  function _acquire(
    address player,
    uint256 level,
    address[] memory helpers
  ) internal onlyEnabled {
    address[] memory providers = new address[](helpers.length + 1);
    for (uint256 helperIndex = 0; helperIndex < helpers.length; helperIndex++) {
      providers[helperIndex] = helpers[helperIndex];
    }

    providers[helpers.length] = player;

    _gatherRequirements(player, level, providers);

    _levels[player] = level;

    emit Acquired(player, level);
  }

  function _gatherRequirements(
    address player,
    uint256 level,
    address[] memory /*providers*/
  ) internal virtual {
    _checkPreviousLevel(player, level);
  }

  function _checkPreviousLevel(address player, uint256 level) internal view {
    require(level == _levels[player] + 1, 'Skill: acquire invalid level');
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
