// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

import '@openzeppelin/contracts-ethereum-package/contracts/introspection/ERC165Checker.sol';
import './IConsumableProvider.sol';

library ConsumableProviderInterfaceSupport {
  using ERC165Checker for address;

  bytes4 internal constant CONSUMABLE_PROVIDER_INTERFACE_ID = 0x63d9fe18;

  function supportsConsumableProviderInterface(IConsumableProvider provider) internal view returns (bool) {
    return address(provider).supportsInterface(CONSUMABLE_PROVIDER_INTERFACE_ID);
  }
}
