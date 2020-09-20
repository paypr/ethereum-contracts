// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

import '@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts-ethereum-package/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts-ethereum-package/contracts/token/ERC721/IERC721Receiver.sol';
import './ITransferring.sol';
import '../consumable/IConvertibleConsumable.sol';
import '../consumable/ConvertibleConsumableInterfaceSupport.sol';

abstract contract BaseTransferring is ITransferring, IERC721Receiver {
  using ConvertibleConsumableInterfaceSupport for IConvertibleConsumable;

  function _transferToken(
    IERC20 token,
    uint256 amount,
    address recipient
  ) internal {
    token.transfer(recipient, amount);
  }

  function _transferTokenWithExchange(
    IERC20 token,
    uint256 amount,
    address recipient
  ) internal {
    uint256 myBalance = token.balanceOf(address(this));
    if (myBalance < amount && IConvertibleConsumable(address(token)).supportsConvertibleConsumableInterface()) {
      // increase allowance as needed, but only if it's a convertible consumable
      IConvertibleConsumable convertibleConsumable = IConvertibleConsumable(address(token));

      uint256 amountConsumableNeeded = myBalance - amount; // safe since we checked < above
      uint256 amountExchangeToken = convertibleConsumable.amountExchangeTokenNeeded(amountConsumableNeeded);

      ERC20UpgradeSafe exchange = ERC20UpgradeSafe(address(convertibleConsumable.exchangeToken()));
      exchange.increaseAllowance(address(token), amountExchangeToken);
    }

    token.transfer(recipient, amount);
  }

  function _transferItem(
    IERC721 artifact,
    uint256 itemId,
    address recipient
  ) internal {
    artifact.safeTransferFrom(address(this), recipient, itemId);
  }

  function onERC721Received(
    address, /*operator*/
    address, /*from*/
    uint256, /*tokenId*/
    bytes calldata /*data*/
  ) external virtual override returns (bytes4) {
    return this.onERC721Received.selector;
  }
}
