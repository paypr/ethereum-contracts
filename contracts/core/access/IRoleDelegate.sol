// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

interface IRoleDelegate {
  /**
   * @dev Returns `true` if `account` has been granted `role`.
   */
  function isInRole(bytes32 role, address account) external view returns (bool);
}
