// SPDX-License-Identifier: UNLICENSED

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
