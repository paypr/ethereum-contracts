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

import '@openzeppelin/contracts/utils/introspection/IERC165.sol';
import './IArtifact.sol';

library ArtifactSupport {
  function useItems(address action, IArtifact.Item[] memory itemsToUse) internal {
    for (uint256 itemIndex = 0; itemIndex < itemsToUse.length; itemIndex++) {
      IArtifact.Item memory item = itemsToUse[itemIndex];
      IArtifact artifact = item.artifact;
      require(
        IERC165(address(artifact)).supportsInterface(type(IArtifact).interfaceId),
        'ArtifactSupport: item address must support IArtifact'
      );
      artifact.useItem(item.itemId, action);
    }
  }

  function asHelpers(IArtifact.Item[] memory items) internal pure returns (address[] memory) {
    address[] memory helpers = new address[](items.length);
    for (uint256 itemIndex = 0; itemIndex < items.length; itemIndex++) {
      helpers[itemIndex] = address(items[itemIndex].artifact);
    }

    return helpers;
  }
}
