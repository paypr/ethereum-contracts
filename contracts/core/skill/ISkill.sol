// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts-ethereum-package/contracts/introspection/IERC165.sol';

interface ISkill is IERC165 {
  /**
   * Emitted when a skill level is acquired
   *
   * @param player Address of the player
   * @param level The skill level acquired
   */
  event Acquired(address indexed player, uint256 level);

  /**
   * @dev Returns the current level for the sender
   */
  function myCurrentLevel() external view returns (uint256);

  /**
   * @dev Returns the current level for the given player
   */
  function currentLevel(address player) external view returns (uint256);

  /**
   * @dev Acquire the next skill level for the sender.
   * Reverts if the sender does not have the skill requirements.
   */
  function acquireNext(address[] calldata helpers) external returns (bool);
}
