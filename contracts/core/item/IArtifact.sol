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

import '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';
import '../consumable/IConsumableProvider.sol';

interface IArtifact is IERC165Upgradeable, IERC721Upgradeable, IConsumableProvider {
  struct Item {
    IArtifact artifact;
    uint256 itemId;
  }

  /**
   * Emitted when an item is used
   *
   * @param player Address of the player who used the item
   * @param action Address of whatever the item was used for
   * @param itemId The item that was used
   */
  event Used(address indexed player, address indexed action, uint256 indexed itemId);

  /**
   * @dev Returns the number of uses that items start with
   */
  function initialUses() external view returns (uint256);

  /**
   * @dev Returns the number of uses left for the given item
   */
  function usesLeft(uint256 itemId) external view returns (uint256);

  /**
   * @dev Returns the number of uses left for all of the items in circulation
   */
  function totalUsesLeft() external view returns (uint256);

  /**
   * @dev Uses the given item for the given `action`.
   *
   * Emits a {Used} event.
   */
  function useItem(uint256 itemId, address action) external;
}
