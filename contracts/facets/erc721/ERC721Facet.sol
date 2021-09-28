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
import './IERC721.sol';
import './ERC721Impl.sol';

contract ERC721Facet is IERC721 {
  function balanceOf(address owner) external view override returns (uint256 balance) {
    return ERC721Impl.balanceOf(owner);
  }

  function ownerOf(uint256 tokenId) external view override returns (address owner) {
    return ERC721Impl.ownerOf(tokenId);
  }

  function safeTransferFrom(
    address from,
    address to,
    uint256 tokenId
  ) external override {
    DisableableSupport.checkEnabled();

    ERC721Impl.safeTransferFrom(from, to, tokenId);
  }

  function transferFrom(
    address from,
    address to,
    uint256 tokenId
  ) external override {
    DisableableSupport.checkEnabled();

    ERC721Impl.transferFrom(from, to, tokenId);
  }

  function approve(address to, uint256 tokenId) external override {
    DisableableSupport.checkEnabled();

    ERC721Impl.approve(to, tokenId);
  }

  function getApproved(uint256 tokenId) external view override returns (address operator) {
    return ERC721Impl.getApproved(tokenId);
  }

  function setApprovalForAll(address operator, bool approved) external override {
    DisableableSupport.checkEnabled();

    ERC721Impl.setApprovalForAll(operator, approved);
  }

  function isApprovedForAll(address owner, address operator) external view override returns (bool) {
    return ERC721Impl.isApprovedForAll(owner, operator);
  }

  function safeTransferFrom(
    address from,
    address to,
    uint256 tokenId,
    bytes calldata data
  ) external override {
    DisableableSupport.checkEnabled();

    ERC721Impl.safeTransferFrom(from, to, tokenId, data);
  }
}
