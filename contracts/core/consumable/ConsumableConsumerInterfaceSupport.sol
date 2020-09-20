// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

import '@openzeppelin/contracts-ethereum-package/contracts/introspection/ERC165Checker.sol';
import './IConsumableConsumer.sol';

library ConsumableConsumerInterfaceSupport {
  using ERC165Checker for address;

  bytes4 internal constant CONSUMABLE_CONSUMER_INTERFACE_ID = 0x9342f6af;

  function supportsConsumableConsumerInterface(IConsumableConsumer consumer) internal view returns (bool) {
    return address(consumer).supportsInterface(CONSUMABLE_CONSUMER_INTERFACE_ID);
  }
}
