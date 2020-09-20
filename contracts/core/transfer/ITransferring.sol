// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

import '@openzeppelin/contracts-ethereum-package/contracts/introspection/IERC165.sol';
import '@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts-ethereum-package/contracts/token/ERC721/IERC721.sol';

interface ITransferring is IERC165 {
  /**
   * @dev Transfer the given amount of an ERC20 token to the given recipient address.
   */
  function transferToken(
    IERC20 token,
    uint256 amount,
    address recipient
  ) external;

  /**
   * @dev Transfer the given item of an ERC721 token to the given recipient address.
   */
  function transferItem(
    IERC721 artifact,
    uint256 itemId,
    address recipient
  ) external;
}
