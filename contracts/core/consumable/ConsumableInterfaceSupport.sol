// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

import '@openzeppelin/contracts-ethereum-package/contracts/introspection/ERC165Checker.sol';
import './IConsumable.sol';

library ConsumableInterfaceSupport {
  using ERC165Checker for address;

  bytes4 internal constant CONSUMABLE_INTERFACE_ID = 0x0d6673db;

  function supportsConsumableInterface(IConsumable account) internal view returns (bool) {
    return address(account).supportsInterface(CONSUMABLE_INTERFACE_ID);
  }
}
