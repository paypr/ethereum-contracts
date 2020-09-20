// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts-ethereum-package/contracts/introspection/IERC165.sol';
import '../item/IArtifact.sol';
import '../consumable/IConsumable.sol';
import '../activity/IActivity.sol';
import '../skill/ISkill.sol';

interface IPlayer is IERC165 {
  /**
   * @dev Executes the given activity (see {IActivity}), using the given
   * items (see {IArtifact})
   */
  function execute(
    IActivity activity,
    IArtifact.Item[] calldata useItems,
    IConsumable.ConsumableAmount[] calldata amountsToProvide,
    IConsumable.ConsumableAmount[] calldata amountsToConsume
  ) external;

  /**
   * @dev Acquires the given skill (see {ISkill}), using the given
   * items (see {IArtifact})
   */
  function acquireNext(
    ISkill skill,
    IArtifact.Item[] calldata useItems,
    IConsumable.ConsumableAmount[] calldata amountsToProvide
  ) external;
}
