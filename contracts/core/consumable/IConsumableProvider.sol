// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

import '@openzeppelin/contracts-ethereum-package/contracts/introspection/IERC165.sol';
import './IConsumable.sol';

interface IConsumableProvider {
  /**
   * @dev Returns the list of provided consumables
   */
  function consumablesProvided() external view returns (IConsumable[] memory);

  /**
   * @dev Returns whether or not the given consumable is required.
   */
  function isProvided(IConsumable consumable) external view returns (bool);

  /**
   * @dev Returns the amount of the given consumable that is required.
   */
  function amountProvided(IConsumable consumable) external view returns (uint256);
}
