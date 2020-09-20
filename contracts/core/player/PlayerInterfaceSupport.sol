// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

import '@openzeppelin/contracts-ethereum-package/contracts/introspection/ERC165Checker.sol';
import './IPlayer.sol';

library PlayerInterfaceSupport {
  using ERC165Checker for address;

  bytes4 internal constant PLAYER_INTERFACE_ID = 0x9c833abb;

  function supportsPlayerInterface(IPlayer player) internal view returns (bool) {
    return address(player).supportsInterface(PLAYER_INTERFACE_ID);
  }
}
