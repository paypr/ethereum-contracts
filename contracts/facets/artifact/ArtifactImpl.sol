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

import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import '../context/ContextSupport.sol';
import '../consumable/provider/ConsumableProviderSupport.sol';
import '../erc721/ERC721Impl.sol';
import '../erc721/ERC721Support.sol';

library ArtifactImpl {
  using SafeMath for uint256;
  using Counters for Counters.Counter;

  bytes32 private constant ARTIFACT_STORAGE_POSITION = keccak256('paypr.artifact.storage');

  struct ArtifactStorage {
    uint256 initialUses;
    mapping(uint256 => uint256) usesLeft;
    uint256 totalUsesLeft;
    Counters.Counter lastItemId;
  }

  //noinspection NoReturn
  function _artifactStorage() private pure returns (ArtifactStorage storage ds) {
    bytes32 position = ARTIFACT_STORAGE_POSITION;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      ds.slot := position
    }
  }

  function setInitialUses(uint256 _initialUses) internal {
    require(_initialUses > 0, 'Artifact: initial uses must be > 0');

    _artifactStorage().initialUses = _initialUses;
  }

  function initialUses() internal view returns (uint256) {
    return _artifactStorage().initialUses;
  }

  function usesLeft(uint256 itemId) internal view returns (uint256) {
    return _artifactStorage().usesLeft[itemId];
  }

  function totalUsesLeft() internal view returns (uint256) {
    return _artifactStorage().totalUsesLeft;
  }

  function useItem(uint256 itemId, address action) internal {
    address sender = ContextSupport.msgSender();
    address player = ERC721Support.ownerOf(itemId);

    require(sender == player, 'Artifact: must be used by the owner');

    ArtifactStorage storage ds = _artifactStorage();

    ds.usesLeft[itemId] = ds.usesLeft[itemId].sub(1, 'Artifact: no uses left for item');
    ds.totalUsesLeft = ds.totalUsesLeft.sub(1, 'Artifact: no uses left at all');

    ConsumableProviderSupport.provideConsumables(action);

    emit Used(player, action, itemId);
  }

  function mint(address to) internal returns (uint256) {
    ArtifactStorage storage ds = _artifactStorage();

    ds.lastItemId.increment();
    uint256 itemId = ds.lastItemId.current();

    ERC721Impl.mint(to, itemId);

    return itemId;
  }

  function mint(address to, uint256 amount) internal {
    ArtifactStorage storage ds = _artifactStorage();

    for (uint256 index = 0; index < amount; index++) {
      ds.lastItemId.increment();
      uint256 itemId = ds.lastItemId.current();

      ERC721Impl.mint(to, itemId);
    }
  }

  function checkEnoughConsumable() internal view {
    require(ConsumableProviderSupport.canProvideMultiple(totalUsesLeft()), 'Artifact: not enough consumable for items');
  }

  function increaseUsesAfterMinting(uint256 itemId) internal {
    ArtifactStorage storage ds = _artifactStorage();

    ds.usesLeft[itemId] = ds.initialUses;
    ds.totalUsesLeft = ds.totalUsesLeft.add(ds.initialUses);

    checkEnoughConsumable();
  }

  function decreaseUsesBeforeBurning(uint256 itemId) internal {
    ArtifactStorage storage ds = _artifactStorage();

    uint256 _usesLeft = ds.usesLeft[itemId];
    ds.usesLeft[itemId] = 0;
    ds.totalUsesLeft = ds.totalUsesLeft.sub(_usesLeft, 'Artifact: no uses left at all');
  }

  // have to redeclare here even though they are already declared in IArtifact
  event Used(address indexed player, address indexed action, uint256 indexed itemId);
}
