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

import '@openzeppelin/contracts-upgradeable/utils/introspection/ERC165StorageUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
import '../activity/ActivityInterfaceSupport.sol';
import '../activity/IActivity.sol';
import '../consumable/ConsumableInterfaceSupport.sol';
import '../consumable/ConvertibleConsumableInterfaceSupport.sol';
import '../consumable/IConvertibleConsumable.sol';
import '../access/Roles.sol';
import '../skill/ISkill.sol';
import '../skill/SkillInterfaceSupport.sol';
import './IPlayer.sol';
import './PlayerInterfaceSupport.sol';
import '../Disableable.sol';
import '../transfer/TransferringInterfaceSupport.sol';
import '../transfer/ITransferring.sol';
import '../transfer/TransferLogic.sol';
import '../item/ItemUserLogic.sol';

contract Player is
  Initializable,
  ContextUpgradeable,
  ITransferring,
  IPlayer,
  ERC165StorageUpgradeable,
  Disableable,
  Roles
{
  using ActivityInterfaceSupport for IActivity;
  using ConsumableInterfaceSupport for IConsumable;
  using ConvertibleConsumableInterfaceSupport for IConvertibleConsumable;
  using PlayerInterfaceSupport for IPlayer;
  using SkillInterfaceSupport for ISkill;
  using TransferLogic for address;
  using ItemUserLogic for address;

  function initializePlayer(IRoleDelegate roleDelegate) public initializer {
    __ERC165_init();
    _registerInterface(PlayerInterfaceSupport.PLAYER_INTERFACE_ID);
    _registerInterface(RoleDelegateInterfaceSupport.ROLE_DELEGATE_INTERFACE_ID);
    _registerInterface(TransferringInterfaceSupport.TRANSFERRING_INTERFACE_ID);

    if (address(roleDelegate) != address(0)) {
      _addRoleDelegate(roleDelegate);
    } else {
      _addSuperAdmin(_msgSender());
      _addAdmin(_msgSender());
      _addTransferAgent(_msgSender());
    }
  }

  function execute(
    IActivity activity,
    IArtifact.Item[] calldata useItems,
    IConsumable.ConsumableAmount[] calldata amountsToProvide,
    IConsumable.ConsumableAmount[] calldata amountsToConsume
  ) external override onlyEnabled onlyAdmin {
    require(activity.supportsActivityInterface(), 'Player: activity address must support IActivity');

    address(activity).useItems(useItems);

    _provideConsumables(address(activity), amountsToProvide);

    address[] memory helpers = new address[](useItems.length);
    for (uint256 itemIndex = 0; itemIndex < useItems.length; itemIndex++) {
      helpers[itemIndex] = address(useItems[itemIndex].artifact);
    }

    activity.execute(helpers);

    _consumeConsumables(address(activity), amountsToConsume);
  }

  function acquireNext(
    ISkill skill,
    IArtifact.Item[] calldata useItems,
    IConsumable.ConsumableAmount[] calldata amountsToProvide
  ) external override onlyEnabled onlyAdmin {
    require(skill.supportsSkillInterface(), 'Player: skill address must support ISkill');

    address(skill).useItems(useItems);

    _provideConsumables(address(skill), amountsToProvide);

    address[] memory helpers = new address[](useItems.length);
    for (uint256 itemIndex = 0; itemIndex < useItems.length; itemIndex++) {
      helpers[itemIndex] = address(useItems[itemIndex].artifact);
    }

    skill.acquireNext(helpers);
  }

  function _provideConsumables(address consumer, IConsumable.ConsumableAmount[] memory amountsToProvide) internal {
    for (uint256 consumableIndex = 0; consumableIndex < amountsToProvide.length; consumableIndex++) {
      IConsumable.ConsumableAmount memory amountToProvide = amountsToProvide[consumableIndex];
      IConsumable consumable = IConsumable(amountToProvide.consumable);
      require(consumable.supportsConsumableInterface(), 'Player: Consumable must support interface when providing');

      // could fail if not enough resources
      ERC20Upgradeable token = ERC20Upgradeable(address(consumable));
      bool success = token.increaseAllowance(consumer, amountToProvide.amount);
      require(success, 'Provider: Consumable failed to transfer');
    }
  }

  function _consumeConsumables(address provider, IConsumable.ConsumableAmount[] memory amountsToConsume) internal {
    for (uint256 consumableIndex = 0; consumableIndex < amountsToConsume.length; consumableIndex++) {
      IConsumable.ConsumableAmount memory amountToConsume = amountsToConsume[consumableIndex];
      IConsumable consumable = IConsumable(amountToConsume.consumable);
      require(consumable.supportsConsumableInterface(), 'Player: Consumable must support interface when consuming');

      // could fail if not enough resources
      bool success = consumable.transferFrom(provider, address(this), amountToConsume.amount);
      require(success, 'Consumer: Consumable failed to transfer');
    }
  }

  function transferToken(
    IERC20Upgradeable token,
    uint256 amount,
    address recipient
  ) external override onlyTransferAgent onlyEnabled {
    address(this).transferTokenWithExchange(token, amount, recipient);
  }

  function transferItem(
    IERC721Upgradeable artifact,
    uint256 itemId,
    address recipient
  ) external override onlyTransferAgent onlyEnabled {
    address(this).transferItem(artifact, itemId, recipient);
  }

  function onERC721Received(
    address operator,
    address from,
    uint256 tokenId,
    bytes calldata data
  ) external virtual override returns (bytes4) {
    return TransferLogic.onERC721Received(operator, from, tokenId, data);
  }

  function supportsInterface(bytes4 interfaceId)
    public
    view
    virtual
    override(IERC165Upgradeable, AccessControlUpgradeable, ERC165StorageUpgradeable)
    returns (bool)
  {
    return ERC165StorageUpgradeable.supportsInterface(interfaceId);
  }

  function disable() external override onlyAdmin {
    _disable();
  }

  function enable() external override onlyAdmin {
    _enable();
  }

  uint256[50] private ______gap;
}
