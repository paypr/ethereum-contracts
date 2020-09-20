// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

import '@openzeppelin/contracts-ethereum-package/contracts/introspection/ERC165Checker.sol';
import './ILimitedConsumable.sol';

library LimitedConsumableInterfaceSupport {
  using ERC165Checker for address;

  bytes4 internal constant LIMITED_CONSUMABLE_INTERFACE_ID = 0x81b8db38;

  function supportsLimitedConsumableInterface(ILimitedConsumable consumer) internal view returns (bool) {
    return address(consumer).supportsInterface(LIMITED_CONSUMABLE_INTERFACE_ID);
  }
}
