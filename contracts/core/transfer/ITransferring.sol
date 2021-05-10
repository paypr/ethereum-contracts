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

pragma solidity ^0.8.3;

import '@openzeppelin/contracts-upgradeable/utils/introspection/IERC165Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol';

interface ITransferring is IERC165Upgradeable, IERC721ReceiverUpgradeable {
  /**
   * @dev Transfer the given amount of an ERC20 token to the given recipient address.
   */
  function transferToken(
    IERC20Upgradeable token,
    uint256 amount,
    address recipient
  ) external;

  /**
   * @dev Transfer the given item of an ERC721 token to the given recipient address.
   */
  function transferItem(
    IERC721Upgradeable artifact,
    uint256 itemId,
    address recipient
  ) external;
}
