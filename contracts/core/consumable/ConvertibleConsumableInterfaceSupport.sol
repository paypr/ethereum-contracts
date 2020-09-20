// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

import '@openzeppelin/contracts-ethereum-package/contracts/introspection/ERC165Checker.sol';
import './IConvertibleConsumable.sol';

library ConvertibleConsumableInterfaceSupport {
  using ERC165Checker for address;

  bytes4 internal constant CONVERTIBLE_CONSUMABLE_INTERFACE_ID = 0xb669f4a6;

  function supportsConvertibleConsumableInterface(IConvertibleConsumable consumer) internal view returns (bool) {
    return address(consumer).supportsInterface(CONVERTIBLE_CONSUMABLE_INTERFACE_ID);
  }
}
