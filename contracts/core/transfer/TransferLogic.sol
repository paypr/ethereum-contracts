/*
 * Copyright (c) 2020 The Paypr Company, LLC
 *
 * This file is part of Paypr Ethereum Contracts.
 *
 * Paypr Ethereum Contracts is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Paypr Ethereum Contracts is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Paypr Ethereum Contracts.  If not, see <https://www.gnu.org/licenses/>.
 */

// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.6.0;

import '@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts-ethereum-package/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts-ethereum-package/contracts/token/ERC721/IERC721Receiver.sol';
import '../consumable/IConvertibleConsumable.sol';
import '../consumable/ConvertibleConsumableInterfaceSupport.sol';

library TransferLogic {
  using ConvertibleConsumableInterfaceSupport for IConvertibleConsumable;

  function transferToken(
    address, /*account*/
    IERC20 token,
    uint256 amount,
    address recipient
  ) internal {
    token.transfer(recipient, amount);
  }

  function transferTokenWithExchange(
    address account,
    IERC20 token,
    uint256 amount,
    address recipient
  ) internal {
    uint256 myBalance = token.balanceOf(account);
    if (myBalance < amount && IConvertibleConsumable(address(token)).supportsConvertibleConsumableInterface()) {
      // increase allowance as needed, but only if it's a convertible consumable
      IConvertibleConsumable convertibleConsumable = IConvertibleConsumable(address(token));

      uint256 amountConsumableNeeded = amount - myBalance; // safe since we checked < above
      uint256 amountExchangeToken = convertibleConsumable.amountExchangeTokenNeeded(amountConsumableNeeded);

      ERC20UpgradeSafe exchange = ERC20UpgradeSafe(address(convertibleConsumable.exchangeToken()));
      exchange.increaseAllowance(address(token), amountExchangeToken);
    }

    token.transfer(recipient, amount);
  }

  function transferItem(
    address account,
    IERC721 artifact,
    uint256 itemId,
    address recipient
  ) internal {
    artifact.safeTransferFrom(account, recipient, itemId);
  }

  function onERC721Received(
    address, /*operator*/
    address, /*from*/
    uint256, /*tokenId*/
    bytes memory /*data*/
  ) internal pure returns (bytes4) {
    return IERC721Receiver.onERC721Received.selector;
  }
}
