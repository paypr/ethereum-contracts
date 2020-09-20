// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

import '@openzeppelin/contracts-ethereum-package/contracts/introspection/IERC165.sol';
import '@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol';

interface IConsumable is IERC165, IERC20 {
  struct ConsumableAmount {
    IConsumable consumable;
    uint256 amount;
  }

  /**
   * @dev Returns the symbol for the ERC20 token, which is usually a shorter
   * version of the name
   */
  //  function symbol() external view returns (string memory);

  /**
   * @dev Returns the number of decimals that this consumable uses.
   *
   * NOTE: The standard number of decimals is 18, to match ETH
   */
  //  function decimals() external pure returns (uint8);

  /**
   * @dev Returns the amount of tokens owned by caller.
   */
  function myBalance() external view returns (uint256);

  /**
   * @dev Returns the remaining number of tokens that caller will be
   * allowed to spend on behalf of `owner` through {transferFrom}. This is
   * zero by default.
   *
   * This value changes when {increaseAllowance}, {decreaseAllowance} or {transferFrom} are called.
   */
  function myAllowance(address owner) external view returns (uint256);

  /**
   * @dev Atomically increases the allowance granted to `spender` by the caller.
   *
   * This is an alternative to {approve} that can be used as a mitigation for
   * problems described in {IERC20-approve}.
   *
   * Emits an {Approval} event indicating the updated allowance.
   */
  //  function increaseAllowance(address spender, uint256 addedValue) public returns (bool);

  /**
   * @dev Atomically decreases the allowance granted to `spender` by the caller.
   *
   * This is an alternative to {approve} that can be used as a mitigation for
   * problems described in {IERC20-approve}.
   *
   * Emits an {Approval} event indicating the updated allowance.
   */
  //  function decreaseAllowance(address spender, uint256 subtractedValue) public returns (bool);
}
