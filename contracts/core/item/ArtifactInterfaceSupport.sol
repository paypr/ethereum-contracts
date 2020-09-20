// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

import '@openzeppelin/contracts-ethereum-package/contracts/introspection/ERC165Checker.sol';
import './IArtifact.sol';

library ArtifactInterfaceSupport {
  using ERC165Checker for address;

  bytes4 internal constant ARTIFACT_INTERFACE_ID = 0xd3abf7f1;

  function supportsArtifactInterface(IArtifact artifact) internal view returns (bool) {
    return address(artifact).supportsInterface(ARTIFACT_INTERFACE_ID);
  }
}
