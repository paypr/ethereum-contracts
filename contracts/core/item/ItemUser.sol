/*
 * Copyright (c) 2020 The Paypr Company
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
pragma experimental ABIEncoderV2;

import './IArtifact.sol';
import './ArtifactInterfaceSupport.sol';

abstract contract ItemUser {
  using ArtifactInterfaceSupport for IArtifact;

  function _useItems(IArtifact.Item[] memory useItems, address action) internal {
    for (uint256 itemIndex = 0; itemIndex < useItems.length; itemIndex++) {
      IArtifact.Item memory item = useItems[itemIndex];
      IArtifact artifact = item.artifact;
      require(artifact.supportsArtifactInterface(), 'ItemUser: item address must support IArtifact');
      artifact.useItem(item.itemId, action);
    }
  }

  uint256[50] private ______gap;
}
