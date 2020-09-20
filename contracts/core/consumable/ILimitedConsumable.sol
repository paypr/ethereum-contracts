// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

import './IConsumable.sol';

interface ILimitedConsumable is IConsumable {
  /**
   * @dev Emitted when the limit of an `account` is updated. `value` is the new limit.
   */
  event Limited(address indexed account, uint256 value);

  /**
   * @dev Returns the amount of tokens `account` is limited to.
   */
  function limitOf(address account) external view returns (uint256);

  /**
   * @dev Returns the amount of tokens the caller is limited to.
   */
  function myLimit() external view returns (uint256);
}
