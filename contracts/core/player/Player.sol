// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts-ethereum-package/contracts/introspection/ERC165.sol';
import '@openzeppelin/contracts-ethereum-package/contracts/utils/Counters.sol';
import '@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol';
import '../activity/ActivityInterfaceSupport.sol';
import '../activity/IActivity.sol';
import '../consumable/ConsumableInterfaceSupport.sol';
import '../consumable/ConvertibleConsumableInterfaceSupport.sol';
import '../consumable/IConvertibleConsumable.sol';
import '../item/ItemUser.sol';
import '../access/Roles.sol';
import '../skill/ISkill.sol';
import '../skill/SkillInterfaceSupport.sol';
import './IPlayer.sol';
import './PlayerInterfaceSupport.sol';
import '../Disableable.sol';
import '../transfer/BaseTransferring.sol';
import '../transfer/TransferringInterfaceSupport.sol';

contract Player is IPlayer, BaseTransferring, Roles, ERC165UpgradeSafe, Disableable, ItemUser {
  using ActivityInterfaceSupport for IActivity;
  using ConsumableInterfaceSupport for IConsumable;
  using ConvertibleConsumableInterfaceSupport for IConvertibleConsumable;
  using PlayerInterfaceSupport for IPlayer;
  using SkillInterfaceSupport for ISkill;

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

    _useItems(useItems, address(activity));

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

    _useItems(useItems, address(skill));

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
      ERC20UpgradeSafe token = ERC20UpgradeSafe(address(consumable));
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
    IERC20 token,
    uint256 amount,
    address recipient
  ) external override onlyTransferAgent onlyEnabled {
    _transferTokenWithExchange(token, amount, recipient);
  }

  function transferItem(
    IERC721 artifact,
    uint256 itemId,
    address recipient
  ) external override onlyTransferAgent onlyEnabled {
    _transferItem(artifact, itemId, recipient);
  }

  function disable() external override onlyAdmin {
    _disable();
  }

  function enable() external override onlyAdmin {
    _enable();
  }

  uint256[50] private ______gap;
}
