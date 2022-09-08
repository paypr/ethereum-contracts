/*
 * Copyright (c) 2021 The Paypr Company, LLC
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

pragma solidity ^0.8.4;

import '../disableable/DisableableSupport.sol';
import './ITransferring.sol';
import './TransferImpl.sol';

contract TransferFacet is ITransferring {
  function transferValue(uint256 amount, address payable recipient) external payable override {
    TransferImpl.checkTransferAgent();
    DisableableSupport.checkEnabled();

    return TransferImpl.transferValue(amount, recipient);
  }

  function transferToken(
    IERC20 token,
    uint256 amount,
    address recipient
  ) external payable override {
    TransferImpl.checkTransferAgent();
    DisableableSupport.checkEnabled();

    return TransferImpl.transferToken(token, amount, recipient);
  }

  function transferItem(
    IERC721 artifact,
    uint256 itemId,
    address recipient
  ) external payable override {
    TransferImpl.checkTransferAgent();
    DisableableSupport.checkEnabled();

    return TransferImpl.transferItem(artifact, itemId, recipient);
  }

  function onERC721Received(
    address, /*operator*/
    address, /*from*/
    uint256, /*tokenId*/
    bytes calldata /*data*/
  ) external pure override returns (bytes4) {
    return TransferImpl.onERC721Received();
  }
}
