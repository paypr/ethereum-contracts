// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts-ethereum-package/contracts/introspection/IERC165.sol';
import '../consumable/IConsumableConsumer.sol';
import '../consumable/IConsumableProvider.sol';

interface IActivity is IERC165, IConsumableConsumer, IConsumableProvider {
  /**
   * Emitted when an item is used
   *
   * @param player Address of the player who executed the activity
   */
  event Executed(address indexed player);

  /**
   * @dev Returns the number of times this activity has been executed by the given `player`
   */
  function executed(address player) external view returns (uint256);

  /**
   * @dev Returns the total number of times this activity has been executed
   */
  function totalExecuted() external view returns (uint256);

  /**
   * @dev Execute the activity with the given `helpers`.
   *
   * Note: be sure to add allowances for any consumables required before executing.
   *
   * Emits an {Executed} event indicating the activity was executed.
   */
  function execute(address[] calldata helpers) external;
}
