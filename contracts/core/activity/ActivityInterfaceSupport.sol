// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

import '@openzeppelin/contracts-ethereum-package/contracts/introspection/ERC165Checker.sol';
import './IActivity.sol';

library ActivityInterfaceSupport {
  using ERC165Checker for address;

  bytes4 internal constant ACTIVITY_INTERFACE_ID = 0x00f62528;

  function supportsActivityInterface(IActivity activity) internal view returns (bool) {
    return address(activity).supportsInterface(ACTIVITY_INTERFACE_ID);
  }
}
