// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts-ethereum-package/contracts/GSN/Context.sol';
import '../BaseContract.sol';
import './ISkill.sol';
import './SkillInterfaceSupport.sol';
import '../Disableable.sol';
import '../transfer/BaseTransferring.sol';
import '../transfer/TransferringInterfaceSupport.sol';

abstract contract Skill is ISkill, ContextUpgradeSafe, BaseContract, BaseTransferring, Disableable {
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

  uint256[50] private ______gap;
}
