// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

import '@openzeppelin/contracts-ethereum-package/contracts/introspection/IERC165.sol';
import './IConsumable.sol';

interface IConsumableConsumer {
  /**
   * @dev Returns the list of required consumables
   */
  function consumablesRequired() external view returns (IConsumable[] memory);

  /**
   * @dev Returns whether or not the given consumable is required.
   */
  function isRequired(IConsumable consumable) external view returns (bool);

  /**
   * @dev Returns the amount of the given consumable that is required.
   */
  function amountRequired(IConsumable consumable) external view returns (uint256);
}
